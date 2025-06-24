import React, { memo, useCallback, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Settings, Mail, Database, Globe, MoreHorizontal, CheckCircle, Clock, AlertCircle, AlertTriangle, BarChart } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';

interface ActionNodeData {
  label: string;
  description: string;
  actionType: 'api' | 'email' | 'database' | 'webhook' | 'notification';
  icon?: React.ComponentType<any>;
  color: string;
  config?: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'error';
  validation?: {
    isValid: boolean;
    errors: string[];
  };
  metrics?: {
    executionCount: number;
    averageTime: number;
    lastRun?: string;
  };
}

type ActionNodeProps = NodeProps<ActionNodeData>;

export const ActionNode = memo<ActionNodeProps>(({ data, selected }) => {
  // Null check for data
  if (!data) {
    return (
      <GlassCard variant="medium" className="w-72 border-2 border-red-400">
        <div className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300">Invalid Action Node</p>
        </div>
      </GlassCard>
    );
  }

  const [showMetrics, setShowMetrics] = useState(false);
  const [progress, setProgress] = useState(0);

  // Validate and set defaults for all data properties to ensure type safety
  const label = data.label || 'Untitled Action';
  const description = data.description || 'No description available';
  const actionType = data.actionType || 'api';
  
  // Validate status with proper type checking
  const validStatuses: ActionNodeData['status'][] = ['pending', 'executing', 'completed', 'error'];
  const status = validStatuses.includes(data.status) ? data.status : 'pending';
  
  const color = data.color || 'from-blue-500 to-purple-600';
  const validation = data.validation || null;
  const metrics = data.metrics || null;
  
  // Ensure config is properly typed and safe
  const config = data.config || {};

  // Reactive progress updates for executing status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'executing') {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 200);
    } else {
      setProgress(status === 'completed' ? 100 : 0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending': return 'border-blue-400 shadow-blue-400/30';
      case 'executing': return 'border-yellow-400 shadow-yellow-400/30 animate-pulse';
      case 'completed': return 'border-green-400 shadow-green-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  }, []);

  const getActionIcon = useCallback((type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'database': return Database;
      case 'webhook': return Globe;
      case 'api': return Settings;
      default: return Settings;
    }
  }, []);

  const ActionIcon = data.icon || getActionIcon(data.actionType);

  const handleMoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMetrics(!showMetrics);
  }, [showMetrics]);</parameter>

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`relative ${selected ? 'z-10' : ''}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-400 border-2 border-white shadow-lg"
        style={{ zIndex: 10 }}
      />

      {/* Main Node */}
      <GlassCard 
        variant="medium" 
        className={`w-72 border-2 ${getStatusColor(status)} ${
          selected ? 'ring-2 ring-blue-400/50' : ''
        } ${validation && !validation.isValid ? 'border-yellow-400/50' : ''} transition-all duration-200`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <motion.div 
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center relative overflow-hidden`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                />
                {ActionIcon && <ActionIcon className="w-6 h-6 text-white relative z-10" />}
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {label}
                </h3>
                <p className="text-blue-300 text-xs capitalize">
                  {actionType} action
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
                {status === 'completed' && <CheckCircle className="w-3 h-3 text-green-400" />}
                {status === 'executing' && <Clock className="w-3 h-3 text-yellow-400 animate-spin" />}
                {status === 'pending' && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
                {status === 'error' && <div className="w-2 h-2 bg-red-400 rounded-full" />}
                <span className="text-xs text-white capitalize">{status}</span>
              </div>
              
              {/* Validation indicator */}
              {validation && !validation.isValid && (
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleMoreClick}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="w-3 h-3 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-xs mb-3 leading-relaxed">
            {description}
          </p>

          {/* Action Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Action Details</span>
              <span className="text-blue-400 text-xs">
                {actionType === 'email' ? 'SMTP Configured' :
                 actionType === 'database' ? 'Connection Ready' :
                 actionType === 'webhook' ? 'Endpoint Active' :
                 'API Connected'}
              </span>
            </div>

            {/* Configuration Preview */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              {actionType === 'email' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Recipients</span>
                    <span className="text-xs text-white">
                      {data.config?.recipients || '3 contacts'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Template</span>
                    <span className="text-xs text-white">
                      {data.config?.template || 'Weekly Report'}
                    </span>
                  </div>
                </div>
              )}

              {actionType === 'database' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Operation</span>
                    <span className="text-xs text-white">
                      {data.config?.operation || 'INSERT'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Table</span>
                    <span className="text-xs text-white">
                      {data.config?.table || 'reports'}
                    </span>
                  </div>
                </div>
              )}

              {actionType === 'webhook' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Method</span>
                    <span className="text-xs text-white">
                      {data.config?.method || 'POST'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Endpoint</span>
                    <span className="text-xs text-white">
                      {data.config?.endpoint || 'api.example.com'}
                    </span>
                  </div>
                </div>
              )}

              {actionType === 'api' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Method</span>
                    <span className="text-xs text-white">
                      {data.config?.method || 'GET'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">URL</span>
                    <span className="text-xs text-white">
                      {data.config?.url || 'api.service.com'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {status === 'executing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3"
            >
              <div className="w-full bg-white/10 rounded-full h-1">
                <motion.div
                  className="h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Executing...</span>
                <span>{data.config?.progress || '60%'}</span>
              </div>
            </motion.div>
          )}

          {/* Success Indicator */}
          {status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Action completed successfully</span>
              </div>
            </motion.div>
          )}

          {/* Error Indicator */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2 text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span className="text-xs font-medium">
                  {data.config?.errorMessage || 'Action failed'}
                </span>
              </div>
            </motion.div>
          )}

          {/* Metrics Panel */}
          {metrics && showMetrics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <h5 className="text-sm font-medium text-white mb-2 flex items-center">
                <BarChart className="w-4 h-4 mr-2 text-blue-400" />
                Execution Metrics
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 rounded p-2">
                  <div className="text-gray-400">Executions</div>
                  <div className="text-blue-400 font-medium">{metrics.executionCount}</div>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <div className="text-gray-400">Avg Time</div>
                  <div className="text-green-400 font-medium">{metrics.averageTime}ms</div>
                </div>
              </div>
            </motion.div>
          )}
          {/* Validation Errors */}
          {validation && !validation.isValid && validation.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-yellow-500/20"
            >
              <div className="space-y-1">
                {validation.errors.map((error, index) => (
                  <div key={index} className="flex items-center text-xs text-yellow-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {error}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Glow Effect */}
        {selected && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-2xl opacity-20 blur-lg -z-10"
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </GlassCard>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-400 border-2 border-white shadow-lg"
        style={{ zIndex: 10 }}
      />
    </motion.div>
  );
});

ActionNode.displayName = 'ActionNode';