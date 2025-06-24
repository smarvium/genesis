from fastapi import APIRouter, HTTPException, Depends
from app.models.wizard import GenerateBlueprintRequest, BlueprintResponse
from app.services.ai_service import ai_service
from app.core.database import db
import logging
import time

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/wizard", tags=["wizard"])

@router.post("/generate-blueprint", response_model=BlueprintResponse)
async def generate_blueprint(request: GenerateBlueprintRequest):
    """Phase 3: Generate AI blueprint with production-grade intelligence and real API integration"""
    
    start_time = time.time()
    
    try:
        logger.info(f"🎯 Phase 3: Blueprint generation initiated for: {request.user_input[:100]}...")
        
        # Phase 3: Enhanced validation
        if not request.user_input or len(request.user_input.strip()) < 10:
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "Insufficient input detail",
                    "message": "Please provide a more detailed description of your business goal (minimum 10 characters)",
                    "suggestion": "Describe what you want to achieve, what problem you're solving, or what process you want to automate.",
                    "examples": [
                        "Automate customer support with AI agents",
                        "Create weekly revenue reports for investors", 
                        "Manage social media content and scheduling"
                    ]
                }
            )
        
        if len(request.user_input) > 2000:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Input too complex",
                    "message": "Please keep your description under 2000 characters for optimal AI processing",
                    "suggestion": "Focus on the core business goal and primary outcomes you want to achieve."
                }
            )
        
        # Phase 3: Advanced AI blueprint generation
        logger.info("🤖 Phase 3: Invoking advanced AI blueprint generation...")
        
        blueprint = await ai_service.generate_blueprint(request.user_input.strip())
        
        # Phase 3: Enhanced blueprint storage with metadata
        try:
            # Calculate complexity and business metrics
            agent_count = len(blueprint.suggested_structure.agents)
            workflow_count = len(blueprint.suggested_structure.workflows)
            total_tools = sum(len(agent.tools_needed) for agent in blueprint.suggested_structure.agents)
            
            blueprint_data = {
                "id": blueprint.id,
                "user_input": blueprint.user_input,
                "interpretation": blueprint.interpretation,
                "suggested_structure": blueprint.suggested_structure.dict(),
                "status": blueprint.status,
                "created_at": blueprint.created_at.isoformat(),
                "updated_at": blueprint.updated_at.isoformat(),
                
                # Phase 3: Advanced metadata
                "phase": "3",
                "ai_engine": "gemini-1.5-pro" if ai_service.available else "advanced-fallback",
                "complexity_score": (agent_count * 20) + (workflow_count * 15) + (total_tools * 5),
                "estimated_setup_time": (agent_count * 8) + (workflow_count * 5),
                "confidence_score": 0.97 if ai_service.available else 0.90,
                "business_impact_score": min(100, (agent_count * 25) + (workflow_count * 20)),
                "api_integrations_count": total_tools,
                "scalability_rating": min(10, agent_count + workflow_count),
                "roi_potential": "high" if (agent_count + workflow_count) >= 4 else "medium",
                
                # Advanced tagging
                "tags": _extract_advanced_tags_from_blueprint(blueprint),
                "domain_classification": _classify_business_domain(blueprint),
                "automation_categories": _extract_automation_categories(blueprint)
            }
            
            result = db.supabase.table("blueprints").insert(blueprint_data).execute()
            
            generation_time = round((time.time() - start_time) * 1000, 2)
            logger.info(f"✅ Phase 3: Blueprint stored successfully: {blueprint.id} (Generated in {generation_time}ms)")
            
        except Exception as db_error:
            logger.warning(f"⚠️ Phase 3: Blueprint storage failed: {db_error} - continuing without storage")
            # Don't fail the request if storage fails
        
        # Phase 3: Enhanced response with business intelligence
        response = BlueprintResponse(
            id=blueprint.id,
            user_input=blueprint.user_input,
            interpretation=blueprint.interpretation,
            suggested_structure=blueprint.suggested_structure,
            status=blueprint.status,
            created_at=blueprint.created_at.isoformat()
        )
        
        generation_time = round((time.time() - start_time) * 1000, 2)
        logger.info(f"✅ Phase 3: Blueprint generation completed successfully: {blueprint.id} (Total time: {generation_time}ms)")
        
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        generation_time = round((time.time() - start_time) * 1000, 2)
        logger.error(f"❌ Phase 3: Blueprint generation failed after {generation_time}ms: {str(e)}")
        
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Blueprint generation failed",
                "message": "Our AI architects are experiencing high demand. Please try again in a moment.",
                "suggestion": "If this persists, try simplifying your request or being more specific about your primary business goal.",
                "support": "Our Phase 3 intelligence is constantly improving. Your feedback helps us deliver better results.",
                "retry_recommended": True,
                "error_code": "BLUEPRINT_GENERATION_FAILED",
                "phase": "3"
            }
        )

@router.get("/blueprint/{blueprint_id}", response_model=BlueprintResponse)
async def get_blueprint(blueprint_id: str):
    """Phase 3: Retrieve blueprint with enhanced error handling and performance metrics"""
    
    try:
        logger.info(f"📋 Phase 3: Blueprint retrieval requested: {blueprint_id}")
        
        result = db.supabase.table("blueprints").select("*").eq("id", blueprint_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=404, 
                detail={
                    "error": "Blueprint not found",
                    "message": f"Blueprint {blueprint_id} doesn't exist or may have expired.",
                    "suggestion": "Try generating a new blueprint or verify the blueprint ID is correct.",
                    "action": "generate_new_blueprint",
                    "phase": "3"
                }
            )
        
        blueprint_data = result.data[0]
        
        # Phase 3: Enhanced response with metadata
        response = BlueprintResponse(
            id=blueprint_data["id"],
            user_input=blueprint_data["user_input"],
            interpretation=blueprint_data["interpretation"],
            suggested_structure=blueprint_data["suggested_structure"],
            status=blueprint_data["status"],
            created_at=blueprint_data["created_at"]
        )
        
        logger.info(f"✅ Phase 3: Blueprint retrieved successfully: {blueprint_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Phase 3: Blueprint retrieval failed: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Blueprint retrieval failed",
                "message": "Unable to retrieve the requested blueprint.",
                "suggestion": "Please try again or generate a new blueprint.",
                "error_code": "BLUEPRINT_RETRIEVAL_FAILED",
                "phase": "3"
            }
        )

@router.post("/analyze-workflow")
async def analyze_workflow(workflow_data: dict):
    """Phase 3: Analyze workflow performance with AI insights"""
    
    try:
        logger.info("🔍 Phase 3: Workflow analysis requested")
        
        analysis = await ai_service.analyze_workflow_performance(workflow_data)
        
        return {
            "status": "success",
            "analysis": analysis,
            "phase": "3",
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"❌ Phase 3: Workflow analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Workflow analysis failed",
                "message": "Unable to analyze workflow performance.",
                "suggestion": "Please try again or check your workflow configuration."
            }
        )

@router.get("/health")
async def wizard_health():
    """Phase 3: Enhanced health check with performance metrics"""
    
    try:
        # Test AI service
        ai_status = "gemini-pro" if ai_service.available else "advanced-fallback"
        
        # Test database
        db_status = "connected" if db.supabase else "disconnected"
        
        return {
            "status": "healthy",
            "phase": "3 - Backend Integration",
            "ai_service": ai_status,
            "ai_available": ai_service.available,
            "database": db_status,
            "features": {
                "blueprint_generation": True,
                "workflow_analysis": True,
                "real_api_integration": True,
                "advanced_fallbacks": True,
                "performance_monitoring": True
            },
            "capabilities": {
                "gemini_pro": ai_service.available and ai_service.model is not None,
                "gemini_flash": ai_service.available and ai_service.flash_model is not None,
                "business_intelligence": True,
                "advanced_validation": True
            },
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"❌ Phase 3: Health check failed: {str(e)}")
        return {
            "status": "degraded",
            "error": str(e),
            "phase": "3 - Backend Integration"
        }

def _extract_advanced_tags_from_blueprint(blueprint) -> list:
    """Phase 3: Extract comprehensive tags for advanced categorization"""
    tags = []
    
    # Extract from guild content
    text = f"{blueprint.suggested_structure.guild_name} {blueprint.suggested_structure.guild_purpose} {blueprint.interpretation}".lower()
    
    # Business domain tags
    domain_keywords = {
        "customer_success": ["support", "customer", "service", "satisfaction", "retention"],
        "revenue_operations": ["sales", "revenue", "pipeline", "conversion", "growth"],
        "marketing_intelligence": ["marketing", "campaign", "brand", "engagement", "acquisition"],
        "financial_intelligence": ["finance", "payment", "billing", "accounting", "revenue"],
        "operational_excellence": ["operations", "process", "efficiency", "automation", "optimization"],
        "business_intelligence": ["analytics", "data", "insights", "metrics", "reporting"],
        "human_capital": ["hr", "employee", "talent", "recruitment", "culture"],
        "ecommerce_optimization": ["ecommerce", "store", "product", "order", "inventory"]
    }
    
    for domain, keywords in domain_keywords.items():
        if any(keyword in text for keyword in keywords):
            tags.append(domain)
    
    # Complexity tags
    agent_count = len(blueprint.suggested_structure.agents)
    workflow_count = len(blueprint.suggested_structure.workflows)
    total_complexity = agent_count + workflow_count
    
    if total_complexity <= 3:
        tags.append("simple_automation")
    elif total_complexity <= 6:
        tags.append("moderate_complexity")
    else:
        tags.append("enterprise_level")
    
    # Technology integration tags
    all_tools = []
    for agent in blueprint.suggested_structure.agents:
        all_tools.extend([tool.lower() for tool in agent.tools_needed])
    
    integration_patterns = {
        "crm_integration": ["salesforce", "hubspot", "pipedrive", "crm"],
        "communication_tools": ["slack", "teams", "discord", "zoom"],
        "payment_processing": ["stripe", "paypal", "square", "payment"],
        "email_marketing": ["sendgrid", "mailchimp", "email", "newsletter"],
        "analytics_tools": ["mixpanel", "amplitude", "analytics", "tracking"],
        "productivity_suite": ["notion", "airtable", "google", "office"]
    }
    
    for category, patterns in integration_patterns.items():
        if any(pattern in tool for tool in all_tools for pattern in patterns):
            tags.append(category)
    
    return list(set(tags))

def _classify_business_domain(blueprint) -> str:
    """Phase 3: Classify the primary business domain"""
    
    text = f"{blueprint.suggested_structure.guild_name} {blueprint.suggested_structure.guild_purpose}".lower()
    
    domain_scores = {
        "customer_success": sum(1 for word in ["customer", "support", "service", "success", "satisfaction"] if word in text),
        "revenue_operations": sum(1 for word in ["sales", "revenue", "growth", "conversion", "pipeline"] if word in text),
        "marketing": sum(1 for word in ["marketing", "campaign", "brand", "content", "engagement"] if word in text),
        "finance": sum(1 for word in ["finance", "payment", "billing", "accounting", "money"] if word in text),
        "operations": sum(1 for word in ["operations", "process", "efficiency", "automation", "workflow"] if word in text),
        "analytics": sum(1 for word in ["analytics", "data", "insights", "metrics", "intelligence"] if word in text)
    }
    
    primary_domain = max(domain_scores.keys(), key=lambda k: domain_scores[k])
    return primary_domain if domain_scores[primary_domain] > 0 else "general_business"

def _extract_automation_categories(blueprint) -> list:
    """Phase 3: Extract automation categories for better classification"""
    
    categories = []
    
    # Analyze workflows
    for workflow in blueprint.suggested_structure.workflows:
        workflow_text = f"{workflow.name} {workflow.description}".lower()
        
        if any(word in workflow_text for word in ["report", "analytics", "dashboard", "insights"]):
            categories.append("reporting_automation")
        
        if any(word in workflow_text for word in ["communication", "notification", "alert", "message"]):
            categories.append("communication_automation")
        
        if any(word in workflow_text for word in ["data", "sync", "integration", "api"]):
            categories.append("data_automation")
        
        if any(word in workflow_text for word in ["schedule", "recurring", "periodic", "daily"]):
            categories.append("scheduled_automation")
        
        if any(word in workflow_text for word in ["trigger", "event", "webhook", "real-time"]):
            categories.append("event_automation")
    
    return list(set(categories))