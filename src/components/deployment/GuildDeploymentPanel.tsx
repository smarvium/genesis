import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Cpu,
  Brain,
  Database,
  Zap,
  Shield,
  CloudLightning,
  Workflow
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { Blueprint } from '../../types';

interface GuildDeploymentPanelProps {
  blueprint: Blueprint;
  onSuccess?: (deploymentId: string) => void;
  onError?: (error: string) => void;
}

export const GuildDeploymentPanel: React.FC<GuildDeploymentPanelProps> = ({
  blueprint,
  onSuccess,
  onError
}) => {
  const [deploymentState, setDeploymentState] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Define deployment steps
  const deploymentSteps = [
    { id: 'init', label: 'Initializing deployment', icon: Rocket },
    { id: 'infrastructure', label: 'Setting up infrastructure', icon: CloudLightning },
    { id: 'agents', label: 'Deploying AI agents', icon: Brain },
    { id: 'database', label: 'Configuring database', icon: Database },
    { id: 'workflows', label: 'Setting up workflows', icon: Workflow },
    { id: 'security', label: 'Implementing security measures', icon: Shield },
    { id: 'monitoring', label: 'Enabling monitoring', icon: Zap },
    { id: 'testing', label: 'Running final tests', icon: Cpu },
    { id: 'activation', label: 'Activating guild services', icon: CheckCircle }
  ];

  // Start deployment process
  const startDeployment = () => {
    if (deploymentState === 'deploying') return;
    
    setDeploymentState('deploying');
    setProgress(0);
    setCurrentStep(0);
    setError(null);
    
    // Simulate deployment process
    simulateDeployment();
  };

  // Simulate deployment process with realistic steps and timing
  const simulateDeployment = () => {
    let currentStep = 0;
    let totalProgress = 0;
    
    // Create unique deployment ID
    const depId = `guild-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Function to advance to next step
    const advanceStep = () => {
      if (currentStep >= deploymentSteps.length - 1) {
        // Deployment complete
        setDeploymentState('success');
        setProgress(100);
        setDeploymentId(depId);
        
        if (onSuccess) {
          onSuccess(depId);
        }
        
        return;
      }
      
      // Move to next step
      currentStep++;
      setCurrentStep(currentStep);
      
      // Calculate progress (not entirely linear)
      const stepWeight = [5, 10, 20, 15, 20, 10, 10, 5, 5]; // Weights for each step
      totalProgress += stepWeight[currentStep - 1] || 10;
      setProgress(Math.min(totalProgress, 95)); // Cap at 95% until complete
      
      // Randomized step duration to simulate real deployment
      const stepDuration = 1000 + Math.random() * 2000;
      setTimeout(advanceStep, stepDuration);
    };
    
    // Start the first step after a short delay
    setTimeout(advanceStep, 800);
  };

  return (
    <GlassCard variant="medium" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">
              {deploymentState === 'idle' ? 'Guild Deployment' :
               deploymentState === 'deploying' ? 'Deploying Your Guild...' :
               deploymentState === 'success' ? 'Guild Deployed Successfully!' :
               'Deployment Error'}
            </h2>
            <p className="text-gray-300">
              {deploymentState === 'idle' ? 'Launch your AI workforce to production' :
               deploymentState === 'deploying' ? 'Setting up your autonomous digital workspace' :
               deploymentState === 'success' ? 'Your AI guild is now live and operational' :
               'We encountered an issue during deployment'}
            </p>
          </div>
        </div>
        
        {deploymentState === 'idle' && (
          <HolographicButton onClick={startDeployment} glow>
            <Rocket className="w-4 h-4 mr-2" />
            Start Deployment
          </HolographicButton>
        )}
      </div>
      
      {/* Deployment Status */}
      <AnimatePresence mode="wait">
        {deploymentState === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="idle-state"
          >
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Deployment Overview</h3>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 rounded-lg p-4 border border-white/10">
                  <Cpu className="w-5 h-5 text-blue-400 mb-2" />
                  <div className="text-sm text-gray-300">AI Agents</div>
                  <div className="text-xl font-semibold text-white">
                    {blueprint.suggested_structure.agents.length}
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/10">
                  <Workflow className="w-5 h-5 text-purple-400 mb-2" />
                  <div className="text-sm text-gray-300">Workflows</div>
                  <div className="text-xl font-semibold text-white">
                    {blueprint.suggested_structure.workflows.length}
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/10">
                  <Clock className="w-5 h-5 text-green-400 mb-2" />
                  <div className="text-sm text-gray-300">Est. Deploy Time</div>
                  <div className="text-xl font-semibold text-white">
                    {Math.max(1, Math.ceil((blueprint.suggested_structure.agents.length + blueprint.suggested_structure.workflows.length) / 3))} min
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-white font-medium">Deployment Steps</h4>
                <div className="space-y-2">
                  {deploymentSteps.map((step, index) => (
                    <div 
                      key={step.id}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                        <step.icon className="w-4 h-4" />
                      </div>
                      <span className="text-gray-300">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                Your guild will be deployed with all agents, workflows, and integrations configured according to your simulation and blueprint.
              </p>
              <HolographicButton onClick={startDeployment} size="lg" glow>
                <Rocket className="w-5 h-5 mr-2" />
                Deploy {blueprint.suggested_structure.guild_name}
              </HolographicButton>
            </div>
          </motion.div>
        )}
        
        {deploymentState === 'deploying' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="deploying-state"
          >
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 text-sm">Deployment Progress</span>
                </div>
                <span className="text-white font-medium">{progress}%</span>
              </div>
              
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              {deploymentSteps.map((step, index) => (
                <motion.div 
                  key={step.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ 
                    x: 0, 
                    opacity: index <= currentStep ? 1 : 0.5 
                  }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-3 p-4 rounded-lg ${
                    index < currentStep ? 'bg-green-900/20 border border-green-700/30' :
                    index === currentStep ? 'bg-blue-900/20 border border-blue-700/30' :
                    'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index < currentStep ? 'bg-green-500/20 text-green-400' :
                    index === currentStep ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <span className={`${
                      index < currentStep ? 'text-green-300' :
                      index === currentStep ? 'text-blue-300' :
                      'text-gray-300'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  
                  {index === currentStep && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-blue-300 text-sm"
                    >
                      In progress...
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {deploymentState === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="success-state"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                Deployment Complete!
              </h3>
              
              <p className="text-gray-300 mb-6">
                Your guild has been successfully deployed and is now live
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 inline-block">
                <div className="text-sm text-gray-300">Guild ID</div>
                <div className="text-lg font-mono text-white">{deploymentId}</div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 rounded-lg p-4 border border-white/10">
                <Brain className="w-5 h-5 text-purple-400 mb-2" />
                <div className="text-sm text-gray-300">AI Model</div>
                <div className="text-white">Gemini Flash</div>
                <div className="text-xs text-gray-400 mt-1">Default intelligence engine</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 border border-white/10">
                <Cpu className="w-5 h-5 text-blue-400 mb-2" />
                <div className="text-sm text-gray-300">Agent Status</div>
                <div className="text-green-400">All Online</div>
                <div className="text-xs text-gray-400 mt-1">
                  {blueprint.suggested_structure.agents.length} active agents
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 border border-white/10">
                <Workflow className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="text-sm text-gray-300">Workflows</div>
                <div className="text-white">Operational</div>
                <div className="text-xs text-gray-400 mt-1">
                  {blueprint.suggested_structure.workflows.length} workflows ready
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <HolographicButton 
                variant="outline"
                onClick={() => window.open('/dashboard', '_blank')}
              >
                <Zap className="w-4 h-4 mr-2" />
                View Dashboard
              </HolographicButton>
              
              <HolographicButton 
                glow
                onClick={() => window.open('/guild/' + deploymentId, '_blank')}
              >
                <Cpu className="w-4 h-4 mr-2" />
                Manage Guild
              </HolographicButton>
            </div>
          </motion.div>
        )}
        
        {deploymentState === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="error-state"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                Deployment Failed
              </h3>
              
              <p className="text-gray-300 mb-6">
                {error || 'We encountered an issue during deployment. Please try again.'}
              </p>
            </div>
            
            <div className="flex justify-center space-x-4">
              <HolographicButton 
                variant="outline"
                onClick={() => setDeploymentState('idle')}
              >
                View Details
              </HolographicButton>
              
              <HolographicButton 
                onClick={startDeployment}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Retry Deployment
              </HolographicButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};