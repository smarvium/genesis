import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Bot, Settings, Play, Pause, MoreHorizontal, Zap, Brain } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';

interface AgentNodeData {
  label: string;
  role: string;
  description: string;
  tools: string[];
  personality?: string;
  icon: React.ComponentType<any>;
  color: string;
  status: 'ready' | 'executing' | 'paused' | 'error' | 'completed';
}

// Create a type that extends NodeProps but with required width/height
type AgentNodeProps = NodeProps<AgentNodeData>;

export const AgentNode = memo<AgentNodeProps>(({ data, selected }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'border-blue-400 shadow-blue-400/30';
      case 'executing': return 'border-green-400 shadow-green-400/30 animate-pulse';
      case 'paused': return 'border-yellow-400 shadow-yellow-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      case 'completed': return 'border-emerald-400 shadow-emerald-400/30';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executing': return <Play className="w-3 h-3 text-green-400" />;
      case 'paused': return <Pause className="w-3 h-3 text-yellow-400" />;
      case 'error': return <Zap className="w-3 h-3 text-red-400" />;
      case 'completed': return <Brain className="w-3 h-3 text-emerald-400" />;
      default: return <Bot className="w-3 h-3 text-blue-400" />;
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
        className="w-3 h-3 bg-purple-400 border-2 border-white shadow-lg"
      />

      {/* Main Node */}
      <GlassCard 
        variant="medium" 
        className={`w-80 border-2 ${getStatusColor(data.status)} ${
          selected ? 'ring-2 ring-purple-400/50' : ''
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
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <data.icon className="w-6 h-6 text-white relative z-10" />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {data.label}
                </h3>
                <p className="text-purple-300 text-xs">
                  {data.role}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
                {getStatusIcon(data.status)}
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

          {/* Tools */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Tools & Integrations</span>
              <span className="text-purple-400 text-xs">{data.tools.length} connected</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {data.tools.slice(0, 3).map((tool, index) => (
                <motion.span
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                >
                  {tool}
                </motion.span>
              ))}
              {data.tools.length > 3 && (
                <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full border border-gray-500/30">
                  +{data.tools.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar (when executing) */}
          {data.status === 'executing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3"
            >
              <div className="w-full bg-white/10 rounded-full h-1">
                <motion.div
                  className="h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Processing...</span>
                <span>75%</span>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: selected ? 1 : 0, 
              height: selected ? 'auto' : 0 
            }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center hover:bg-green-500/30 transition-colors"
                >
                  <Play className="w-3 h-3 text-green-400" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                >
                  <Settings className="w-3 h-3 text-blue-400" />
                </motion.button>
              </div>
              
              <span className="text-xs text-gray-400">
                Agent ID: {data.label.toLowerCase().replace(/\s+/g, '-')}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Glow Effect */}
        {selected && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-20 blur-lg -z-10"
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
        className="w-3 h-3 bg-purple-400 border-2 border-white shadow-lg"
      />
    </motion.div>
  );
});