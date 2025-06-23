import React, { useEffect } from 'react';
import { CheckCircle, Sparkles, ArrowRight, Bot, Workflow, Brain } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

export const DeploymentStep: React.FC = () => {
  const { 
    blueprint, 
    simulationResults,
    deploymentId,
    isLoading,
    deployGuild,
    reset,
    errors 
  } = useWizardStore();

  useEffect(() => {
    // Auto-deploy if we have simulation results but no deployment ID
    if (simulationResults && !deploymentId && !isLoading) {
      deployGuild();
    }
  }, [simulationResults, deploymentId, isLoading, deployGuild]);

  const handleGoToDashboard = () => {
    reset();
    // In a real app, this would navigate to the dashboard
    window.location.href = '/dashboard';
  };

  const handleCreateAnother = () => {
    reset();
  };

  const isDeploying = isLoading || (!deploymentId && simulationResults);
  const isDeployed = deploymentId && !isLoading;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isDeploying ? 'Deploying Your Guild...' : 'Guild Deployed Successfully!'}
          </h1>
          <p className="text-lg text-gray-600">
            {isDeploying 
              ? 'Setting up your AI-native infrastructure with intelligent agents'
              : 'Your autonomous digital workspace is live and ready for action'
            }
          </p>
        </div>

        {errors.length > 0 && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-6">
            {errors.join(', ')}
          </div>
        )}

        {isDeploying ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Creating AI Infrastructure
              </h3>
              <div className="space-y-3 text-gray-600 max-w-md mx-auto">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Initializing guild structure</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mr-2"></div>
                  <span>Deploying AI agents with memory systems</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-2"></div>
                  <span>Configuring voice and tool integrations</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-2"></div>
                  <span>Running final validation checks</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isDeployed ? (
          <div className="space-y-6">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  {blueprint?.suggested_structure.guild_name}
                </CardTitle>
                <p className="text-gray-600">Guild ID: {deploymentId}</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Bot className="w-5 h-5 mr-2 text-blue-600" />
                      Live AI Agents ({blueprint?.suggested_structure.agents.length})
                    </h4>
                    <ul className="space-y-2">
                      {blueprint?.suggested_structure.agents.map((agent, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          <div>
                            <span className="font-medium">{agent.name}</span>
                            <span className="text-gray-500 ml-2">({agent.role})</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Workflow className="w-5 h-5 mr-2 text-purple-600" />
                      Active Workflows ({blueprint?.suggested_structure.workflows.length})
                    </h4>
                    <ul className="space-y-2">
                      {blueprint?.suggested_structure.workflows.map((workflow, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          <div>
                            <span className="font-medium">{workflow.name}</span>
                            <span className="text-xs text-gray-500 block">{workflow.trigger_type} trigger</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">🎉 Your Guild is Live!</h5>
                  <p className="text-blue-800 text-sm">
                    All agents are active with memory systems enabled. They can process voice commands, 
                    maintain conversation context, and execute workflows autonomously. 
                    Performance metrics show {simulationResults?.execution_time}s average response time.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🚀 What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Intelligent Interaction</h4>
                    <p className="text-sm text-gray-600">
                      Chat with your agents using natural language. They understand context and remember everything.
                    </p>
                  </div>
                  
                  <div className="p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Adaptive Learning</h4>
                    <p className="text-sm text-gray-600">
                      Agents learn from every interaction, improving their responses and understanding over time.
                    </p>
                  </div>
                  
                  <div className="p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Workflow className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Autonomous Execution</h4>
                    <p className="text-sm text-gray-600">
                      Workflows run automatically based on triggers, while agents collaborate to achieve complex goals.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={handleCreateAnother}>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Another Guild
              </Button>
              <Button onClick={handleGoToDashboard} size="lg">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};