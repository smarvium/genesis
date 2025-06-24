import React, { useState } from 'react';
import { X, Save, Trash2, Mail, Database, Globe, Settings, Wand2, MessageSquare } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { HolographicButton } from '../HolographicButton';
import { apiService } from '../../../services/apiService';
import { ActionNodeData } from '../../../types/canvas';

interface ActionConfigProps {
  data: ActionNodeData;
  onUpdate: (data: Partial<ActionNodeData>) => void;
  onClose: () => void;
}

export function ActionConfig({ data, onUpdate, onClose }: ActionConfigProps) {
  const [formData, setFormData] = useState<{
    label: string;
    description: string;
    actionType: string;
    config: any;
    curlCommand: string;
    isGeneratingCurl: boolean;
    isTestingApi: boolean;
    testResult: any;
  }>({
    label: data.label,
    description: data.description,
    actionType: data.actionType,
    config: data.config || {},
    curlCommand: '',
    isGeneratingCurl: false,
    isTestingApi: false,
    testResult: null
  });

  const handleGenerateCurl = async () => {
    setFormData({
      ...formData,
      isGeneratingCurl: true
    });
    
    try {
      let curlCommand;

      if (formData.actionType === 'api' || formData.actionType === 'webhook') {
        // Generate curl command with AI assistance
        curlCommand = await apiService.generateCurlWithGemini(
          `Generate a curl command for ${formData.description || formData.label}`,
          {
            method: formData.config.method,
            endpoint: formData.config.url,
          }
        );
      } else if (formData.actionType === 'notification') {
        curlCommand = await apiService.generateCurlWithGemini(
          `Generate a curl command to send a ${formData.actionType} to ${formData.config.channel || '#general'}`,
          { 
            service: formData.config.service
          }
        );
      } else if (formData.actionType === 'email') {
        curlCommand = await apiService.generateCurlWithGemini(
          `Generate a curl command to send an email with subject "${formData.config.subject || 'Email Subject'}"`,
          { 
            service: 'sendgrid'
          }
        );
      } else {
        // Fallback to simple curl generation
        curlCommand = await apiService.generateCurlCommand({
          method: (formData.config.method as any) || 'POST',
          url: formData.config.url || 'https://api.example.com/endpoint',
          body: { message: formData.description || 'Test message' }
        });
      }

      setFormData({
        ...formData,
        curlCommand,
        isGeneratingCurl: false
      });
    } catch (error) {
      setFormData({
        ...formData,
        curlCommand: '# Error generating curl command',
        isGeneratingCurl: false
      });
    }
  };
  
  // Test the API call
  const handleTestApiCall = async () => {
    if (!formData.config.url && (formData.actionType === 'api' || formData.actionType === 'webhook')) {
      return; // Can't test without a URL
    }
    
    setFormData({
      ...formData,
      isTestingApi: true,
      testResult: null
    });
    
    try {
      // Prepare test config
      const testConfig: any = {
        method: formData.config.method || 'GET',
        url: formData.config.url || 'https://jsonplaceholder.typicode.com/posts/1', // Fallback to a test API
        body: formData.config.body || {}
      };
      
      // Execute test API call
      const result = await apiService.executeRequest(testConfig);
      
      setFormData({
        ...formData,
        isTestingApi: false,
        testResult: result
      });
    } catch (error: any) {
      setFormData({
        ...formData,
        isTestingApi: false,
        testResult: {
          error: true,
          message: error.message || 'Failed to execute API request'
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      label: formData.label,
      description: formData.description,
      actionType: formData.actionType,
      config: formData.config
    });
    onClose();
  };

  return (
    <GlassCard title="Action Configuration" className="w-96">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Configure Action</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Action Label
          </label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter action name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe what this action does"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Action Type
          </label>
          <select
            value={formData.actionType}
            onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="api">API Call</option>
            <option value="webhook">Webhook</option>
            <option value="email">Email</option>
            <option value="notification">Notification</option>
            <option value="database">Database Operation</option>
          </select>
        </div>

        {formData.actionType === 'api' || formData.actionType === 'webhook' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL
              </label>
              <input
                type="url"
                value={formData.config.url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, url: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Method
              </label>
              <select
                value={formData.config.method || 'GET'}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, method: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
          </div>
        ) : formData.actionType === 'email' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.config.subject || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, subject: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email subject"
              />
            </div>
          </div>
        ) : formData.actionType === 'notification' ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Channel
            </label>
            <input
              type="text"
              value={formData.config.channel || ''}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config, channel: e.target.value }
              })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#general"
            />
          </div>
        ) : null}

        {/* API Tools Section */}
        {(formData.actionType === 'api' || formData.actionType === 'webhook' || formData.actionType === 'email' || formData.actionType === 'notification') && (
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400">API Tools</span>
              <div className="flex space-x-2">
                <HolographicButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateCurl}
                  className="text-xs"
                  disabled={formData.isGeneratingCurl}
                >
                  {formData.isGeneratingCurl ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3 mr-1" />
                      Generate cURL
                    </>
                  )}
                </HolographicButton>
                
                <HolographicButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleTestApiCall}
                  className="text-xs"
                  disabled={formData.isTestingApi || !formData.config.url}
                >
                  {formData.isTestingApi ? (
                    <>Testing...</>
                  ) : (
                    <>
                      <Globe className="w-3 h-3 mr-1" />
                      Test API
                    </>
                  )}
                </HolographicButton>
              </div>
            </div>
            
            {/* cURL Command Display */}
            {formData.curlCommand && (
              <div className="mt-3 bg-black/50 rounded-lg border border-gray-700/50">
                <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono overflow-x-auto p-2">
                  {formData.curlCommand}
                </pre>
              </div>
            )}
            
            {/* Test Result Display */}
            {formData.testResult && (
              <div className={`mt-3 rounded-lg p-3 border ${formData.testResult.error ? 'bg-red-900/20 border-red-700/30' : 'bg-green-900/20 border-green-700/30'}`}>
                <div className="text-xs mb-2 font-medium">
                  {formData.testResult.error ? (
                    <span className="text-red-400">API Test Failed</span>
                  ) : (
                    <span className="text-green-400">API Test Successful (Status: {formData.testResult.status})</span>
                  )}
                </div>
                
                <div className="text-xs text-white/70 max-h-32 overflow-y-auto">
                  {formData.testResult.error ? (
                    formData.testResult.message
                  ) : (
                    <pre className="whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(formData.testResult.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <HolographicButton
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </HolographicButton>
          <HolographicButton type="submit">
            <Save className="w-4 h-4 mr-2" />
            Save Action
          </HolographicButton>
        </div>
      </form>
    </GlassCard>
  );
}