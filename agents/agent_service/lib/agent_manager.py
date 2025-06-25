import os
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple
import httpx
from uuid import uuid4
from dotenv import load_dotenv
from .memory_service import get_memory_service
from .gemini_service import get_gemini_service
from .voice_service import get_voice_service

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentManager:
    """Manager for handling agent operations and execution."""
    
    def __init__(self):
        """Initialize the agent manager."""
        self.agents = {}  # In-memory agent cache
        self.memory_service = get_memory_service()
        self.gemini_service = get_gemini_service()
        self.voice_service = get_voice_service()
        logger.info("🤖 Agent Manager initialized")
    
    async def execute_agent(
        self,
        agent_id: str,
        input_text: str,
        context: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute an agent with the given input and context.
        
        Args:
            agent_id: The ID of the agent to execute.
            input_text: The text input for the agent.
            context: Additional context for the agent execution.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        logger.info(f"🤖 Executing agent {agent_id}")
        
        # Get agent configuration
        agent_config = await self._get_agent_config(agent_id, context)
        
        # Check if this is a specialized agent
        if agent_id.startswith("seo_") or "seo" in agent_id:
            return await self._execute_seo_agent(input_text, context, agent_config)
        elif agent_id.startswith("business_") or "business" in agent_id or "analyst" in agent_id:
            return await self._execute_business_agent(input_text, context, agent_config)
        elif agent_id.startswith("customer_") or "support" in agent_id or "customer" in agent_id:
            return await self._execute_customer_support_agent(input_text, context, agent_config)
        elif agent_id.startswith("data_") or "data" in agent_id:
            return await self._execute_data_science_agent(input_text, context, agent_config)
        elif agent_id == "agent-simulator":
            return await self._execute_simulation_agent(input_text, context, agent_config)
        else:
            # Generic agent execution
            return await self._execute_generic_agent(input_text, context, agent_config)
    
    async def _get_agent_config(
        self, 
        agent_id: str, 
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get the agent configuration.
        
        Args:
            agent_id: The agent ID.
            context: The execution context.
            
        Returns:
            Agent configuration dictionary.
        """
        # In a full implementation, we would fetch this from a database
        # For now, we'll create a mock configuration based on the agent_id
        
        # Extract agent type from ID
        agent_type = "generic"
        if "seo" in agent_id:
            agent_type = "seo"
        elif "business" in agent_id or "analyst" in agent_id:
            agent_type = "business"
        elif "support" in agent_id or "customer" in agent_id:
            agent_type = "support"
        elif "data" in agent_id:
            agent_type = "data"
        
        # Create configuration
        config = {
            "id": agent_id,
            "name": context.get("agent_name", f"{agent_type.capitalize()} Agent"),
            "role": context.get("agent_role", f"{agent_type.capitalize()} Specialist"),
            "description": context.get("agent_description", f"AI agent specialized in {agent_type} tasks"),
            "personality": context.get("agent_personality", "Professional, helpful, and knowledgeable"),
            "tools": context.get("agent_tools", []),
            "memory": context.get("memory_enabled", True),
            "voice": context.get("voice_enabled", False),
            "voice_id": context.get("voice_id", None)
        }
        
        return config
    
    async def _execute_generic_agent(
        self, 
        input_text: str, 
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a generic agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Construct the system prompt
        system_prompt = f"""
        You are {agent_config['name']}, an AI agent serving as a {agent_config['role']}.
        
        Your primary responsibility: {agent_config['description']}
        
        You have access to the following tools: {', '.join(agent_config['tools']) if agent_config['tools'] else 'No specific tools configured'}
        
        Personality: {agent_config['personality']}
        
        Please process the user's request and provide a helpful, accurate response.
        Think step-by-step and explain your reasoning process.
        """
        
        # Fetch recent memories if memory is enabled
        memories = []
        if agent_config['memory']:
            memories = await self.memory_service.retrieve_recent_memories(agent_config['id'], limit=5)
            
            # Add important memories too
            important_memories = await self.memory_service.retrieve_important_memories(agent_config['id'], limit=3)
            
            # Combine and deduplicate memories
            memory_ids = set(memory['id'] for memory in memories)
            for memory in important_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Append memories to the prompt if available
        memory_context = ""
        if memories:
            memory_context = "\nRelevant context from previous interactions:\n"
            for i, memory in enumerate(memories, 1):
                memory_context += f"{i}. {memory['content']}\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.7
        )
        
        # Store this interaction in memory if enabled
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": context
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={"type": "conversation"},
                importance=0.7,  # Standard importance for conversations
                user_id=context.get("user_id")
            )
            
            logger.info(f"✅ Stored conversation in memory for agent {agent_config['id']}")
        
        # Generate voice if enabled
        if agent_config['voice'] and self.voice_service.enabled:
            voice_id = agent_config.get('voice_id') or self.voice_service.voice_id
            audio_base64 = await self.voice_service.synthesize_speech(
                text=output_text,
                voice_id=voice_id
            )
            
            if audio_base64:
                logger.info(f"✅ Generated voice response for agent {agent_config['id']}")
                # In a real implementation, we would return the audio data too
        
        return output_text, chain_of_thought
    
    async def _execute_seo_agent(
        self, 
        input_text: str, 
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute an SEO specialized agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Customize system prompt for SEO agent
        system_prompt = f"""
        You are {agent_config['name']}, an expert SEO specialist with deep knowledge of search engine optimization, 
        keyword research, content optimization, and SEO strategy.
        
        Your primary responsibility: {agent_config['description'] or "To provide expert SEO advice and create SEO-optimized content"}
        
        Your expertise includes:
        - Keyword research and analysis
        - On-page and technical SEO
        - Content optimization for search engines
        - SEO strategy development
        - Metadata and schema optimization
        
        When responding:
        - Provide specific, actionable SEO recommendations
        - Include keyword suggestions when relevant
        - Explain SEO concepts clearly and concisely
        - Support advice with SEO best practices
        - Consider user search intent in all recommendations
        
        Personality: {agent_config['personality'] or "Professional, data-driven, and strategic"}
        
        Please process the SEO-related request and provide expert guidance.
        """
        
        # Get relevant memories for SEO context
        memories = []
        if agent_config['memory']:
            # Get both recent and important memories
            recent_memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            important_memories = await self.memory_service.retrieve_important_memories(
                agent_config['id'], limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in recent_memories)
            for memory in important_memories:
                if memory['id'] not in memory_ids:
                    recent_memories.append(memory)
            
            memories = recent_memories
            
            # Also try to search for relevant memories based on the input
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant SEO context from previous interactions:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    # Try to parse JSON content
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Response: {mem_data['agent_response'][:100]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.5  # Lower temperature for more deterministic SEO advice
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "seo",
                    "query_keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={"type": "seo_conversation"},
                importance=0.8,  # Higher importance for SEO interactions
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
    
    async def _execute_business_agent(
        self, 
        input_text: str, 
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a business analysis specialized agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Customize system prompt for business analysis agent
        system_prompt = f"""
        You are {agent_config['name']}, an expert business analyst and strategic advisor with 
        deep experience in business strategy, market analysis, financial planning, and operational excellence.
        
        Your primary responsibility: {agent_config['description'] or "To provide insightful business analysis and strategic recommendations"}
        
        Your expertise includes:
        - Market research and competitive analysis
        - Business model evaluation
        - Financial modeling and forecasting
        - Operational efficiency optimization
        - Strategic planning and execution
        
        When responding:
        - Provide data-driven insights when possible
        - Include specific, actionable recommendations
        - Consider both short and long-term business implications
        - Be precise with numbers and metrics
        - Highlight potential risks and opportunities
        
        Personality: {agent_config['personality'] or "Strategic, analytical, and business-focused"}
        
        Please process the business-related request and provide expert analysis.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            # Get both recent and important memories
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=5
            )
            
            # Also search for topic-specific memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=3
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant business context from previous interactions:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    # Try to parse JSON content
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Key insights: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.3  # Lower temperature for more precise business analysis
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "business_analysis",
                    "topic_keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={"type": "business_conversation"},
                importance=0.9,  # Higher importance for business analysis
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
    
    async def _execute_customer_support_agent(
        self, 
        input_text: str, 
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a customer support specialized agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Customize system prompt for customer support agent
        system_prompt = f"""
        You are {agent_config['name']}, a helpful and empathetic customer support specialist
        with expertise in resolving customer issues and providing exceptional service.
        
        Your primary responsibility: {agent_config['description'] or "To provide friendly, efficient customer support"}
        
        Your expertise includes:
        - Addressing customer concerns with empathy
        - Troubleshooting common issues
        - Providing clear step-by-step instructions
        - Finding creative solutions to customer problems
        - De-escalating difficult situations
        
        When responding:
        - Be empathetic and understanding
        - Provide clear, actionable steps
        - Use a friendly, conversational tone
        - Always validate the customer's concerns
        - Focus on solutions, not just explanations
        
        Personality: {agent_config['personality'] or "Friendly, patient, and solution-oriented"}
        
        Please process the customer's request and provide helpful support.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            # For customer support, recent interactions are important
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            
            # Also search for issue-specific memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nPrevious customer interactions:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    # Try to parse JSON content
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Customer: {mem_data['user_input']}\n"
                            memory_context += f"   Support: {mem_data['agent_response'][:100]}...\n"
                        else:
                            memory_context += f"{i}. {content[:100]}...\n"
                    except:
                        memory_context += f"{i}. {content[:100]}...\n"
                else:
                    memory_context += f"{i}. {content[:100]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.6  # Moderate temperature for creative but consistent support
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "customer_support",
                    "issue_keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={"type": "support_conversation"},
                importance=0.75,  # Moderate importance for support interactions
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
    
    async def _execute_data_science_agent(
        self, 
        input_text: str, 
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a data science specialized agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Customize system prompt for data science agent
        system_prompt = f"""
        You are {agent_config['name']}, an expert data scientist with deep knowledge of
        data analysis, statistics, machine learning, and data visualization.
        
        Your primary responsibility: {agent_config['description'] or "To analyze data and provide data-driven insights"}
        
        Your expertise includes:
        - Statistical analysis and hypothesis testing
        - Machine learning model selection and evaluation
        - Data preprocessing and feature engineering
        - Data visualization and insight communication
        - Experimental design and A/B testing
        
        When responding:
        - Provide statistically sound analysis
        - Explain complex concepts clearly
        - Suggest appropriate analytical approaches
        - Be precise about limitations and assumptions
        - Focus on actionable insights from data
        
        Personality: {agent_config['personality'] or "Analytical, precise, and insightful"}
        
        Please process the data analysis request and provide expert guidance.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            # For data science, both recent and topic-specific memories matter
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            
            # Also get important memories
            important_memories = await self.memory_service.retrieve_important_memories(
                agent_config['id'], limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in important_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
            
            # Also search for topic-specific memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant data analysis context from previous interactions:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    # Try to parse JSON content
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Key findings: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.3  # Lower temperature for precise data analysis
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "data_science",
                    "analysis_keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={"type": "data_analysis"},
                importance=0.85,  # Higher importance for data analysis
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
    
    async def _execute_simulation_agent(
        self, 
        input_text: str, 
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute the simulation agent, which is designed for testing other agents.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # This agent simulates responses for the simulation lab
        
        # Customize system prompt for simulation agent
        system_prompt = f"""
        You are a simulation agent that helps test and validate other AI agents. 
        Your responses should realistically simulate how an agent would respond in a production environment.
        
        When responding:
        - Be realistic about capabilities and limitations
        - Provide detailed responses that demonstrate the agent's expertise
        - Include appropriate technical details when relevant
        - Respond as if you are a specialized agent in the requested domain
        
        Personality: Professional, detailed, and realistic
        
        If the user asks about a specific domain:
        - For support queries: Be empathetic and solution-focused
        - For business analysis: Be data-driven and strategic
        - For technical questions: Be precise and informative
        - For creative tasks: Be innovative while adhering to guidelines
        
        Please provide a realistic simulation response based on the user's input.
        """
        
        # Generate appropriate response for simulation
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=input_text,
            system_instruction=system_prompt,
            temperature=0.6  # Moderate temperature for realistic simulation
        )
        
        return output_text, chain_of_thought
    
    async def close(self):
        """Close all service connections."""
        await self.memory_service.close()
        await self.gemini_service.close()
        await self.voice_service.close()


# Helper function to extract keywords from text
def extract_keywords(text: str) -> List[str]:
    """Extract key terms from a text string.
    
    Args:
        text: The input text.
        
    Returns:
        List of extracted keywords.
    """
    # Simple implementation - split by spaces, remove common words, punctuation
    common_words = {
        "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
        "in", "on", "at", "to", "for", "with", "by", "about", "like",
        "from", "of", "as", "my", "our", "your", "their", "his", "her", "its",
        "i", "we", "you", "they", "he", "she", "it", "this", "that",
        "what", "which", "who", "whom", "whose", "when", "where", "why", "how",
        "can", "could", "would", "should", "will", "shall", "may", "might",
        "must", "have", "has", "had", "do", "does", "did", "am", "is", "are",
        "was", "were", "be", "been", "being"
    }
    
    # Tokenize and filter
    words = text.lower().split()
    words = [word.strip(".,;:!?\"'()[]{}-") for word in words]
    keywords = [word for word in words if word and len(word) > 2 and word not in common_words]
    
    # Deduplicate
    unique_keywords = list(set(keywords))
    
    # Get top keywords (by frequency)
    keyword_counts = {word: keywords.count(word) for word in unique_keywords}
    sorted_keywords = sorted(unique_keywords, key=lambda x: keyword_counts[x], reverse=True)
    
    return sorted_keywords[:10]  # Return up to 10 keywords


# Create a singleton instance for the agent manager
_agent_manager = None

def get_agent_manager() -> AgentManager:
    """Get the singleton AgentManager instance.
    
    Returns:
        AgentManager instance.
    """
    global _agent_manager
    if _agent_manager is None:
        _agent_manager = AgentManager()
    return _agent_manager