import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Clock, Timer, MoreHorizontal, Pause } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';

interface DelayNodeData {
  label: string;
  description: string;
  delayType: 'fixed' | 'dynamic' | 'conditional';
  duration: string;
  icon: React.ComponentType<any>;
  color: string;
  status: 'ready' | 'waiting' | 'paused' | 'completed';
}

// Create a type that extends NodeProps but with required width/height
type DelayNodeProps = NodeProps<DelayNodeData>;

export const DelayNode = memo<DelayNodeProps>(({ data, selected }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'border-violet-400 shadow-violet-400/30';
      case 'waiting': return 'border-yellow-400 shadow-yellow-400/30 animate-pulse';
      case 'paused': return 'border-gray-400 shadow-gray-400/30';
      case 'completed': return 'border-green-400 shadow-green-400/30';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  };

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
        className="w-3 h-3 bg-violet-400 border-2 border-white shadow-lg"
      />

      {/* Main Node */}
      <GlassCard 
        variant="medium" 
        className={`w-64 border-2 ${getStatusColor(data.status)} ${
          selected ? 'ring-2 ring-violet-400/50' : ''
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
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <Clock className="w-6 h-6 text-white relative z-10" />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {data.label}
                </h3>
                <p className="text-violet-300 text-xs">
                  {data.duration}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
                {data.status === 'waiting' && <Timer className="w-3 h-3 text-yellow-400" />}
                {data.status === 'paused' && <Pause className="w-3 h-3 text-gray-400" />}
                {data.status === 'completed' && <div className="w-2 h-2 bg-green-400 rounded-full" />}
                {data.status === 'ready' && <div className="w-2 h-2 bg-violet-400 rounded-full" />}
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

          {/* Delay Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Delay Type</span>
              <span className="text-violet-400 text-xs capitalize">
                {data.delayType}
              </span>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4 text-violet-400" />
                <span className="text-white text-sm font-medium">{data.duration}</span>
              </div>
              
              {data.status === 'waiting' && (
                <div className="mt-2">
                  <div className="w-full bg-white/10 rounded-full h-1">
                    <motion.div
                      className="h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Waiting...</span>
                    <span>2:30 remaining</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Waiting Animation */}
          {data.status === 'waiting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  className="w-2 h-2 bg-violet-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-violet-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-violet-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Glow Effect */}
        {selected && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl opacity-20 blur-lg -z-10"
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
        className="w-3 h-3 bg-violet-400 border-2 border-white shadow-lg"
      />
    </motion.div>
  );
});