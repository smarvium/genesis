import React, { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Play, Calendar, Globe, Zap, MoreHorizontal, AlertCircle, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';

interface TriggerNodeData {
  label: string;
  triggerType: 'manual' | 'schedule' | 'webhook' | 'event';
  description: string;
  icon?: React.ComponentType<any>;
  color: string;
  config?: Record<string, any>;
  status: 'ready' | 'active' | 'triggered' | 'error';
  schedule?: {
    frequency?: string;
    nextRun?: string;
    timezone?: string;
  };
  webhook?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
}

type TriggerNodeProps = NodeProps<TriggerNodeData>;

export const TriggerNode = memo<TriggerNodeProps>(({ data, selected = false }) => {
  // Null check for data - ISSUE #1 FIXED
  if (!data) {
    return (
      <GlassCard variant="medium" className="w-72 border-2 border-red-400">
        <div className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300">Invalid Trigger Node</p>
        </div>
      </GlassCard>
    );
  }

  const [isValidated, setIsValidated] = useState(false);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'ready': return 'border-emerald-400 shadow-emerald-400/30';
      case 'active': return 'border-green-400 shadow-green-400/30 animate-pulse';
      case 'triggered': return 'border-yellow-400 shadow-yellow-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  }, []);

  const getTriggerIcon = useCallback((type: string) => {
    switch (type) {
      case 'manual': return Play;
      case 'schedule': return Calendar;
      case 'webhook': return Globe;
      case 'event': return Zap;
      default: return Play;
    }
  }, []);

  const handleMoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Add your more actions logic here
  }, []);

  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (triggerType === 'manual' && status === 'ready') {
      // Simulate trigger activation
      console.log(`Manual trigger activated: ${label}`);
    }
  }, []);

  // Validate trigger configuration
  useEffect(() => {
    const validate = () => {
      switch (triggerType) {
        case 'webhook':
          return !!(data.webhook?.url && data.webhook?.method);
        case 'schedule':
          return !!(data.schedule?.frequency);
        case 'event':
          return !!(data.config?.event);
        case 'manual':
        default:
          return true;
      }
    };
    setIsValidated(validate());
  }, [data, triggerType]);
  // Ensure required fields exist with default values - ISSUE #3 FIXED
  const label = data.label || 'Untitled Trigger';
  const description = data.description || 'No description available';
  const triggerType = data.triggerType || 'manual';
  const status = data.status || 'ready';
  const color = data.color || 'from-emerald-500 to-green-600';

  const TriggerIcon = data.icon || getTriggerIcon(triggerType);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`relative ${selected ? 'z-10' : ''}`}
    >
      {/* Main Node */}
      <GlassCard 
        variant="medium" 
        className={`w-72 border-2 ${getStatusColor(status)} ${
          selected ? 'ring-2 ring-emerald-400/50' : ''
        } ${!isValidated ? 'border-yellow-400/50' : ''} transition-all duration-200`}
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
                {/* Conditional animated background - ISSUE #5 FIXED */}
                {selected && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                )}
                {TriggerIcon && <TriggerIcon className="w-6 h-6 text-white relative z-10" />}
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {label}
                </h3>
                <p className="text-emerald-300 text-xs capitalize">
                  {triggerType} trigger
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'active' ? 'bg-green-400 animate-pulse' :
                  status === 'triggered' ? 'bg-yellow-400' :
                  status === 'error' ? 'bg-red-400' : 'bg-emerald-400'
                }`} />
                <span className="text-xs text-white capitalize">{status}</span>
              </div>
              
              {/* Validation indicator */}
              {!isValidated && (
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

          {/* Trigger Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Configuration</span>
              <span className="text-emerald-400 text-xs">
                {triggerType === 'schedule' ? (data.config?.schedule || 'Every Monday 9:00 AM') :
                 triggerType === 'webhook' ? (data.config?.endpoint || 'POST /webhook/trigger') :
                 triggerType === 'event' ? (data.config?.event || 'On data change') :
                 'Manual activation'}
              </span>
            </div>

            {/* Visual representation of trigger type */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              {triggerType === 'schedule' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span className="text-white text-xs">Scheduled</span>
                    </div>
                    <div className="text-xs text-gray-300">
                      {data.config?.nextRun || 'Next: Today 9:00 AM'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Frequency</span>
                    <span className="text-xs text-white">
                      {data.config?.frequency || 'Weekly'}
                    </span>
                  </div>
                </div>
              )}

              {triggerType === 'webhook' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span className="text-white text-xs">Webhook</span>
                    </div>
                    <div className="text-xs text-gray-300">
                      {data.config?.webhookStatus || 'API Ready'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Method</span>
                    <span className="text-xs text-white">
                      {data.config?.method || 'POST'}
                    </span>
                  </div>
                </div>
              )}

              {triggerType === 'manual' && (
                <div className="flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleTriggerClick}
                    className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                    disabled={status === 'active' || status === 'triggered'}
                  >
                    <Play className="w-3 h-3" />
                    <span className="text-xs">
                      {status === 'active' ? 'Running...' : 
                       status === 'triggered' ? 'Triggered' : 'Trigger Now'}
                    </span>
                  </motion.button>
                </div>
              )}

              {triggerType === 'event' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span className="text-white text-xs">Event Listener</span>
                    </div>
                    <div className="text-xs text-gray-300">
                      {data.config?.listenerStatus || 'Monitoring'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Event Type</span>
                    <span className="text-xs text-white">
                      {data.config?.eventType || 'Data Change'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Indicator */}
          {status === 'active' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Activity</span>
                <div className="flex items-center space-x-2">
                  <motion.div
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-xs text-green-400">Listening</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Success Indicator */}
          {status === 'triggered' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2 text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-xs font-medium">Trigger activated successfully</span>
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
                  {data.config?.errorMessage || 'Trigger failed'}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Glow Effect */}
        {selected && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 rounded-2xl opacity-20 blur-lg -z-10"
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

      {/* Output Handle - ISSUE #4 FIXED - Using consistent styling */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-emerald-400 border-2 border-white shadow-lg"
        style={{ zIndex: 10 }}
      />

      {/* Configuration warning */}
      {!isValidated && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-500/90 text-yellow-900 text-xs px-2 py-1 rounded whitespace-nowrap"
        >
          Configuration needed
        </motion.div>
      )}
    </motion.div>
  );
});

TriggerNode.displayName = 'TriggerNode';