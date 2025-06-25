import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Define node structure interface
interface NodeData {
  label: string;
  [key: string]: any;
}

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
let supabase: SupabaseClient | undefined;

// Initialize Redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient: RedisClientType | undefined;

// Setup middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize clients
async function initializeClients() {
  // Initialize Supabase if URL and key are provided
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your_supabase') && !supabaseKey.includes('your_supabase')) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  } else {
    console.warn('⚠️ Supabase credentials not configured - using mock data');
  }

  // Initialize Redis if URL is provided
  if (redisUrl && !redisUrl.includes('your_redis') && !redisUrl.includes('localhost')) {
    try {
      redisClient = createRedisClient({ url: redisUrl });
      await redisClient.connect();
      console.log('✅ Redis client connected');
    } catch (error) {
      console.warn('⚠️ Redis connection failed - using in-memory cache instead');
      console.warn('⚠️ Using in-memory cache instead');
    }
  } else {
    console.log('ℹ️ Redis not configured for development - using in-memory cache');
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    message: 'GenesisOS Orchestrator is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Blueprint to Canvas generation endpoint
app.post('/generateCanvas', async (req, res) => {
  try {
    console.log('🎨 Canvas generation request received');
    const blueprint = req.body.blueprint;
    
    // Validate blueprint
    if (!blueprint) {
      return res.status(400).json({ 
        error: 'Missing blueprint',
        message: 'Blueprint data is required'
      });
    }
    
    if (!blueprint.suggested_structure) {
      return res.status(400).json({ 
        error: 'Invalid blueprint structure',
        message: 'Blueprint must include suggested_structure'
      });
    }

    // Generate canvas nodes and edges
    const { nodes, edges } = generateCanvasFromBlueprint(blueprint);
    
    console.log(`✅ Generated canvas with ${nodes.length} nodes and ${edges.length} edges`);
    
    return res.status(200).json({ 
      success: true,
      nodes,
      edges,
      message: 'Canvas generated successfully'
    });
  } catch (error: any) {
    console.error('❌ Error generating canvas:', error);
    return res.status(500).json({ 
      error: 'Failed to generate canvas',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Execute workflow endpoint
app.post('/executeFlow', async (req, res) => {
  try {
    console.log('🔄 Workflow execution request received');
    const { flowId, nodes, edges, context = {} }: {
      flowId?: string;
      nodes: WorkflowNode[];
      edges: any[];
      context?: any;
    } = req.body;
    
    if (!nodes || !nodes.length) {
      return res.status(400).json({ 
        error: 'Invalid workflow data',
        message: 'Workflow nodes are required'
      });
    }

    // Create execution context
    const executionId = uuidv4();
    const executionContext = {
      id: executionId,
      status: 'initializing',
      startTime: new Date(),
      nodes: {},
      variables: context,
      logs: []
    };

    console.log(`🔄 Starting flow execution: ${executionId}`);
    
    // Find trigger nodes (entry points)
    const triggerNodes = nodes.filter((node: WorkflowNode) => node.type === 'trigger');
    if (!triggerNodes.length) {
      return res.status(400).json({ 
        error: 'Invalid workflow structure',
        message: 'Workflow must contain at least one trigger node'
      });
    }

    // Start async execution
    console.log(`✅ Execution started: ${executionId} with ${nodes.length} nodes`);
    executeWorkflow(executionId, triggerNodes[0].id, nodes, edges, executionContext);
    
    // Return immediately with execution ID
    return res.status(202).json({ 
      executionId,
      message: 'Workflow execution started',
      status: 'running'
    });
  } catch (error: any) {
    console.error('❌ Error executing workflow:', error);
    return res.status(500).json({ 
      error: 'Failed to execute workflow',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Agent dispatch endpoint
app.post('/agentDispatch', async (req, res) => {
  try {
    console.log('🤖 Agent dispatch request received');
    const { agent_id, input, context = {} } = req.body;
    
    if (!agent_id || !input) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'agent_id and input are required'
      });
    }

    console.log(`Dispatching to agent ${agent_id} with input: ${input}`);
    const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
    
    // Call agent service
    console.log(`Calling agent service at ${AGENT_SERVICE_URL}/agent/${agent_id}/execute`);
    const agentRequestPayload = {
      input,
      context
    };
    
    const agentResponse = await axios.post(
      `${AGENT_SERVICE_URL}/agent/${agent_id}/execute`, 
      agentRequestPayload
    );
    
    console.log('Agent response received');
    
    // Log agent response (if Supabase is configured)
    if (supabase) {
      try {
        const { error } = await supabase.from('agent_traces').insert({
          agent_id,
          context_id: context.executionId || uuidv4(),
          event_type: 'agent_response',
          payload: {
            input,
            output: agentResponse.data.output,
            chain_of_thought: agentResponse.data.chain_of_thought
          },
          user_id: context.user_id || '00000000-0000-0000-0000-000000000000'
        });
        
        if (error) {
          console.warn('⚠️ Error logging agent response:', error);
        }
      } catch (logError) {
        console.warn('⚠️ Failed to log agent response to Supabase:', logError);
      }
    }
    
    res.json(agentResponse.data);
  } catch (error: any) {
    console.error('❌ Error dispatching to agent:', error);
    
    // If agent service is unreachable, use a fallback response
    if (error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
      console.log('⚠️ Agent service unreachable, using fallback response');
      return res.json({
        output: `I processed your request about "${req.body.input}" and have generated a response using my fallback capabilities. For optimal results, please ensure the agent service is running.`,
        chain_of_thought: "Using fallback response generator since agent service is unavailable.",
        status: "completed_fallback"
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to dispatch to agent',
      status: 'error'
    });
  }
});

// Get execution status endpoint
app.get('/execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    if (!executionId) {
      return res.status(400).json({ error: 'Execution ID is required' });
    }

    // Get execution context from Redis or in-memory store
    // For now, return mock data
    res.json({
      id: executionId,
      status: 'completed',
      startTime: new Date(Date.now() - 5000),
      endTime: new Date(),
      nodes: {
        'trigger-1': { status: 'completed', startTime: new Date(Date.now() - 5000), endTime: new Date(Date.now() - 4500) },
        'agent-1': { status: 'completed', startTime: new Date(Date.now() - 4500), endTime: new Date(Date.now() - 3000) },
        'action-1': { status: 'completed', startTime: new Date(Date.now() - 3000), endTime: new Date(Date.now() - 1000) }
      },
      logs: [
        { timestamp: new Date(Date.now() - 5000), level: 'info', message: 'Workflow execution started' },
        { timestamp: new Date(Date.now() - 4500), level: 'info', message: 'Trigger activated' },
        { timestamp: new Date(Date.now() - 4000), level: 'info', message: 'Agent processing input' },
        { timestamp: new Date(Date.now() - 3000), level: 'info', message: 'Agent completed processing' },
        { timestamp: new Date(Date.now() - 2500), level: 'info', message: 'Action execution started' },
        { timestamp: new Date(Date.now() - 1000), level: 'info', message: 'Action completed' },
        { timestamp: new Date(), level: 'info', message: 'Workflow execution completed' }
      ]
    });
  } catch (error: any) {
    console.error('❌ Error getting execution status:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get execution status',
      status: 'error'
    });
  }
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const { source, event, payload } = req.body;
    
    console.log(`📡 Webhook received from ${source || 'unknown source'}`);
    console.log(`📡 Event: ${event || 'unspecified event'}`);
    
    // Process webhook event
    // In a real implementation, this would trigger relevant workflows
    
    res.status(200).json({ 
      received: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process webhook',
      status: 'error'
    });
  }
});

// Start the server
app.listen(PORT, async () => {
  await initializeClients();
  console.log(`🚀 GenesisOS Orchestrator listening at http://localhost:${PORT}`);
});

// Helper function to generate canvas from blueprint
function generateCanvasFromBlueprint(blueprint: any) {
  if (!blueprint || !blueprint.suggested_structure) {
    throw new Error('Invalid blueprint structure');
  }
  
  const nodes: any[] = [];
  const edges: any[] = [];
  
  // Create trigger node
  nodes.push({
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 50, y: 200 },
    data: {
      label: 'Guild Activation',
      triggerType: 'manual',
      description: `Initiates the ${blueprint.suggested_structure.guild_name} workflow`,
      icon: 'Rocket',
      color: 'from-emerald-500 to-teal-500',
      status: 'ready'
    },
  });
  
  // Create agent nodes with smart layout algorithm
  blueprint.suggested_structure.agents.forEach((agent: any, index: number) => {
    const angle = (index * 2 * Math.PI) / blueprint.suggested_structure.agents.length;
    const radius = 300;
    const centerX = 500;
    const centerY = 300;
    
    // Determine agent icon based on role
    const getAgentIcon = (role: string) => {
      const roleKeywords = {
        'analyst': 'BarChart',
        'support': 'MessageSquare',
        'sales': 'DollarSign',
        'marketing': 'Sparkles',
        'finance': 'DollarSign',
        'operations': 'Settings',
        'hr': 'Users',
        'customer': 'Heart',
        'data': 'Database',
        'content': 'FileText',
        'social': 'Share2',
        'email': 'Mail',
        'report': 'FileText',
        'intelligence': 'Brain',
        'specialist': 'Target',
      };

      // Find matching role keyword
      const matchingKeyword = Object.keys(roleKeywords).find(keyword => 
        role.toLowerCase().includes(keyword)
      );

      return matchingKeyword ? roleKeywords[matchingKeyword as keyof typeof roleKeywords] : 'Bot';
    };
    
    // Determine agent color
    const getAgentColor = (index: number) => {
      const colors = [
        'from-purple-500 to-pink-500',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-red-500',
        'from-violet-500 to-purple-500',
        'from-indigo-500 to-blue-500',
      ];
      return colors[index % colors.length];
    };
    
    const agentNode = {
      id: `agent-${index + 1}`,
      type: 'agent',
      position: { 
        x: centerX + Math.cos(angle) * radius, 
        y: centerY + Math.sin(angle) * radius 
      },
      data: {
        label: agent.name,
        role: agent.role,
        description: agent.description,
        tools: agent.tools_needed,
        icon: getAgentIcon(agent.role),
        color: getAgentColor(index),
        status: 'ready'
      },
    };
    nodes.push(agentNode);

    // Create connections between agents and trigger
    if (index === 0) {
      edges.push({
        id: `trigger-agent-${index + 1}`,
        source: 'trigger-1',
        target: `agent-${index + 1}`,
        type: 'smoothstep',
        animated: true, 
        style: { stroke: '#10b981', strokeWidth: 3 },
        markerEnd: { type: 'arrowclosed', color: '#10b981' },
        sourceHandle: null,
        targetHandle: null
      });
    }

    // Create connections between agents
    if (index > 0) {
      edges.push({
        id: `agent-${index}-agent-${index + 1}`,
        source: `agent-${index}`,
        target: `agent-${index + 1}`,
        type: 'smoothstep',
        animated: true, 
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed', color: '#8b5cf6' },
        sourceHandle: null,
        targetHandle: null
      });
    }
  });

  // Create workflow action nodes
  const getWorkflowIcon = (triggerType: string) => {
    const triggerIcons: Record<string, string> = {
      'schedule': 'Clock',
      'webhook': 'Globe',
      'manual': 'Play',
      'event': 'Zap',
    };
    return triggerIcons[triggerType] || 'Workflow';
  };

  // Get workflow color
  const getWorkflowColor = (triggerType: string) => {
    const triggerColors: Record<string, string> = {
      'schedule': 'from-blue-500 to-indigo-500',
      'webhook': 'from-green-500 to-emerald-500',
      'manual': 'from-purple-500 to-violet-500',
      'event': 'from-yellow-500 to-orange-500',
    };
    return triggerColors[triggerType] || 'from-gray-500 to-slate-500';
  };

  // Map trigger type to action type
  const mapTriggerTypeToActionType = (triggerType: string) => {
    const mapping: Record<string, string> = {
      'schedule': 'database',
      'webhook': 'api',
      'manual': 'notification',
      'event': 'webhook',
    };
    return mapping[triggerType] || 'api';
  };

  blueprint.suggested_structure.workflows.forEach((workflow: any, index: number) => {
    const workflowNode = {
      id: `workflow-${index + 1}`,
      type: 'action',
      position: { 
        x: 200 + (index * 400), 
        y: 600 
      },
      data: {
        label: workflow.name,
        description: workflow.description,
        actionType: mapTriggerTypeToActionType(workflow.trigger_type),
        icon: getWorkflowIcon(workflow.trigger_type),
        color: getWorkflowColor(workflow.trigger_type),
        status: 'pending'
      },
    };
    nodes.push(workflowNode);

    // Connect agents to workflows
    if (blueprint.suggested_structure.agents.length > 0) {
      const targetAgentIndex = Math.min(index + 1, blueprint.suggested_structure.agents.length);
      edges.push({
        id: `agent-${targetAgentIndex}-workflow-${index + 1}`,
        source: `agent-${targetAgentIndex}`,
        target: `workflow-${index + 1}`,
        type: 'smoothstep',
        animated: true, 
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed', color: '#f59e0b' },
        sourceHandle: null,
        targetHandle: null
      });
    }
  });

  return { nodes, edges };
}

// Helper function to execute workflow
async function executeWorkflow(executionId: string, startNodeId: string, nodes: WorkflowNode[], edges: any[], context: any) {
  console.log(`⚙️ Executing workflow ${executionId} starting at node ${startNodeId}`);
  
  // This would be a more complex implementation with node traversal logic
  // For now, we'll simulate execution with a simple timeout
  
  setTimeout(() => {
    console.log(`✅ Workflow ${executionId} execution completed`);
  }, 5000);
}

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  
  // Close Redis client if it exists
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis client closed');
  }
  
  console.log('GenesisOS Orchestrator shutdown complete');
  process.exit(0);
});