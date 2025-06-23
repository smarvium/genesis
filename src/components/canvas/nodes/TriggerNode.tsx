import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Play, Calendar, Globe, Zap, MoreHorizontal } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';

interface TriggerNodeData {
  label: string;
  triggerType: 'manual' | 'schedule' | 'webhook' | 'event';
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  config?: Record<string, any>;
  status: 'ready' | 'active' | 'triggered' | 'error';
}

// Create a type that extends NodeProps but with required width/height
type TriggerNodeProps = NodeProps<TriggerNodeData>;

export const TriggerNode = memo<TriggerNodeProps>(({ data, selected }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'border-emerald-400 shadow-emerald-400/30';
      case 'active': return 'border-green-400 shadow-green-400/30 animate-pulse';
      case 'triggered': return 'border-yellow-400 shadow-yellow-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'manual': return Play;
      case 'schedule': return Calendar;
      case 'webhook': return Globe;
      case 'event': return Zap;
      default: return Play;
    }
  };

  const TriggerIcon = getTriggerIcon(data.triggerType);

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
        className={`w-72 border-2 ${getStatusColor(data.status)} ${
          selected ? 'ring-2 ring-emerald-400/50' : ''
        } transition-all duration-200`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <motion.div 
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${data.color} flex items-center justify-center relative overflow-hidden`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
                <TriggerIcon className="w-6 h-6 text-white relative z-10" />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {data.label}
                </h3>
                <p className="text-emerald-300 text-xs capitalize">
                  {data.triggerType} trigger
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
                <div className={`w-2 h-2 rounded-full ${
                  data.status === 'active' ? 'bg-green-400 animate-pulse' :
                  data.status === 'triggered' ? 'bg-yellow-400' :
                  data.status === 'error' ? 'bg-red-400' : 'bg-emerald-400'
                }`} />
                <span className="text-xs text-white capitalize">{data.status}</span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <MoreHorizontal className="w-3 h-3 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-xs mb-3 leading-relaxed">
            {data.description}
          </p>

          {/* Trigger Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Configuration</span>
              <span className="text-emerald-400 text-xs">
                {data.triggerType === 'schedule' ? 'Every Monday 9:00 AM' :
                 data.triggerType === 'webhook' ? 'POST /webhook/trigger' :
                 data.triggerType === 'event' ? 'On data change' :
                 'Manual activation'}
              </span>
            </div>

            {/* Visual representation of trigger type */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              {data.triggerType === 'schedule' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-xs">Scheduled</span>
                  </div>
                  <div className="text-xs text-gray-300">
                    Next: Today 9:00 AM
                  </div>
                </div>
              )}

              {data.triggerType === 'webhook' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-xs">Webhook</span>
                  </div>
                  <div className="text-xs text-gray-300">
                    API Ready
                  </div>
                </div>
              )}

              {data.triggerType === 'manual' && (
                <div className="flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    <span className="text-xs">Trigger Now</span>
                  </motion.button>
                </div>
              )}

              {data.triggerType === 'event' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-xs">Event Listener</span>
                  </div>
                  <div className="text-xs text-gray-300">
                    Monitoring
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Indicator */}
          {data.status === 'active' && (
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

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-emerald-400 border-2 border-white shadow-lg"
      />
    </motion.div>
  );
});