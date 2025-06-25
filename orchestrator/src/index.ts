import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import blueprintService from './services/blueprintService';
import agentService from './services/agentService';
import workflowService from './services/workflowService';
import memoryService from './services/memoryService';
import simulationService from './services/simulationService';

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
console.log(`🚀 GenesisOS Orchestrator starting up at port ${PORT}`);
console.log(`🤖 Agent Service URL: ${AGENT_SERVICE_URL}`);

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
    console.log('✅ Supabase client initialized successfully');
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
    
    try {
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

      // Generate canvas nodes and edges using the blueprint service
      const { nodes, edges } = blueprintService.generateCanvasFromBlueprint(blueprint);
    
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

    console.log(`🔄 Starting flow execution with ${nodes.length} nodes`);
    
    // Execute the workflow using the workflow service
    const result = await workflowService.executeWorkflow(
      flowId || `flow-${uuidv4()}`,
      nodes,
      edges,
      context
    );
    
    console.log(`✅ Execution started: ${result.executionId}`);
    
    // Return immediately with execution ID
    return res.status(202).json({ 
      executionId: result.executionId,
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
    
    try {
      // Execute the agent using the agent service
      const response = await agentService.executeAgent(agent_id, input, context);
      
      console.log('Agent response received');
      res.json(response);
    } catch (error: any) {
      console.error('❌ Error dispatching to agent:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
        console.log('⚠️ Agent service unreachable, using fallback response');
        return res.json({
          output: `I processed your request about "${input}" and have generated a response using my fallback capabilities. For optimal results, please ensure the agent service is running.`,
          chain_of_thought: "Using fallback response generator since agent service is unavailable.",
          status: "completed_fallback"
        });
      }
      
      res.status(500).json({ 
        error: error.message || 'Failed to dispatch to agent',
        status: 'error'
      });
    }
  } catch (error: any) {
    console.error('❌ Error in agent dispatch route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process agent dispatch request',
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

    // Get the execution status from the workflow service
    const executionStatus = workflowService.getExecutionStatus(executionId);
    
    if (!executionStatus) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `No execution found with ID: ${executionId}`
      });
    }
    
    res.json(executionStatus);
  } catch (error: any) {
    console.error('❌ Error getting execution status:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get execution status',
      status: 'error'
    });
  }
});

// Blueprint generation endpoint
app.post('/generateBlueprint', async (req, res) => {
  try {
    console.log('🧠 Blueprint generation request received');
    const { user_input } = req.body;
    
    if (!user_input) {
      return res.status(400).json({ 
        error: 'Missing user input',
        message: 'User input is required'
      });
    }
    
    console.log(`Generating blueprint for: ${user_input.substring(0, 50)}...`);
    
    try {
      // Generate blueprint
      const blueprint = await blueprintService.generateBlueprint(user_input);
      
      console.log(`✅ Blueprint generated: ${blueprint.id}`);
      
      // Return the blueprint
      return res.json(blueprint);
    } catch (error: any) {
      console.error('❌ Error generating blueprint:', error);
      return res.status(500).json({ 
        error: 'Failed to generate blueprint',
        message: error.message || 'An unexpected error occurred'
      });
    }
  } catch (error: any) {
    console.error('❌ Error in blueprint generation route:', error);
    return res.status(500).json({ 
      error: 'Failed to process blueprint generation request',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Run simulation endpoint
app.post('/simulation/run', async (req, res) => {
  try {
    console.log('🧪 Simulation request received');
    const config = req.body;
    
    if (!config.guild_id || !config.agents) {
      return res.status(400).json({ 
        error: 'Invalid simulation config',
        message: 'Guild ID and agents are required'
      });
    }
    
    try {
      // Run the simulation
      const results = await simulationService.runSimulation(config);
      
      console.log(`✅ Simulation completed: ${results.id}`);
      
      // Return the simulation results
      return res.json(results);
    } catch (error: any) {
      console.error('❌ Error running simulation:', error);
      return res.status(500).json({ 
        error: 'Failed to run simulation',
        message: error.message || 'An unexpected error occurred'
      });
    }
  } catch (error: any) {
    console.error('❌ Error in simulation route:', error);
    return res.status(500).json({ 
      error: 'Failed to process simulation request',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Get simulation results endpoint
app.get('/simulation/:simulationId', async (req, res) => {
  try {
    const { simulationId } = req.params;
    
    if (!simulationId) {
      return res.status(400).json({ error: 'Simulation ID is required' });
    }
    
    // Get the simulation results
    const results = simulationService.getSimulationResults(simulationId);
    
    if (!results) {
      return res.status(404).json({
        error: 'Simulation not found',
        message: `No simulation found with ID: ${simulationId}`
      });
    }
    
    res.json(results);
  } catch (error: any) {
    console.error('❌ Error getting simulation results:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get simulation results',
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
  console.log(`🚀 GenesisOS Orchestrator ready at http://localhost:${PORT}`);
  console.log(`📋 API Endpoints available:
  - POST /generateBlueprint
  - POST /generateCanvas
  - POST /executeFlow
  - GET /execution/:executionId
  - POST /agentDispatch
  - POST /simulation/run
  - GET /simulation/:simulationId
  - POST /webhook
  `);
});

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