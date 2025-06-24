import { X, Save, Trash2, Mail, Database, Globe, Settings, Wand2, MessageSquare } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { HolographicButton } from '../HolographicButton';
import { apiService } from '../../../services/apiService';
import { ActionNodeData } from '../../../types/canvas';

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

              </div>
              
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