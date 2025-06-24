import React, { memo, useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion, MotionValue } from 'framer-motion';
import { Bot, Settings, Play, Pause, MoreHorizontal, Zap, Brain, CheckCircle, AlertCircle, Clock, BarChart } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';
import type { AgentNodeData } from '../../../types/canvas';

export const AgentNode = memo<NodeProps<AgentNodeData>>(({ data, selected = false }) => {
  // Null check for data with proper typing
  if (!data) {
    return (
      <GlassCard variant="medium" className="w-80 border-2 border-red-400">
        <div className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300">Invalid Agent Node</p>
        </div>
      </GlassCard>
    );
  }

  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Safe destructuring with proper typing and defaults
  const typedData = data as AgentNodeData;
  const {
    label = 'Untitled Agent',
    role = 'AI Assistant',
    description = 'No description available',
    tools = [],
    status = 'ready',
    color = 'from-purple-500 to-blue-600',
    icon: IconComponent = Bot,
    performance
  } = typedData;

  // Simulate progress when executing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'executing') {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            return 100;
          }
          return prev + 2;
        });
      }, 100);
    } else {
      setProgress(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'ready': return 'border-blue-400 shadow-blue-400/30';
      case 'executing': return 'border-green-400 shadow-green-400/30 animate-pulse';
      case 'paused': return 'border-yellow-400 shadow-yellow-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      case 'completed': return 'border-emerald-400 shadow-emerald-400/30';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'executing': return <Play className="w-3 h-3 text-green-400" />;
      case 'paused': return <Pause className="w-3 h-3 text-yellow-400" />;
      case 'error': return <Zap className="w-3 h-3 text-red-400" />;
      case 'completed': return <CheckCircle className="w-3 h-3 text-emerald-400" />;
      case 'ready': return <Bot className="w-3 h-3 text-blue-400" />;
      default: return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  }, []);

  const handleMoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Add your more actions logic here
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`relative ${selected ? 'z-10' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-400 border-2 border-white shadow-lg"
        style={{ zIndex: 10 }}
      />

      {/* Main Node */}
      <GlassCard 
        variant="medium" 
        className={`w-80 border-2 ${getStatusColor(status)} ${
          selected ? 'ring-2 ring-purple-400/50' : ''
        } transition-all duration-200`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <motion.div 
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center relative overflow-hidden`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {/* Animated background - only animate when executing */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                  animate={{ rotate: status === 'executing' ? 360 : 0 }}
                  transition={{ 
                    duration: 7, 
                    repeat: status === 'executing' ? Infinity : 0, 
                    ease: "linear" 
                  }}
                />
                <IconComponent className="w-6 h-6 text-white relative z-10" />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {String(label)}
                </h3>
                <p className="text-purple-300 text-xs">
                  {String(role)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
                {getStatusIcon(status)}
                <span className="text-xs text-white capitalize">{String(status)}</span>
              </div>
              
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
            {String(description)}
          </p>

          {/* Tools */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Tools & Integrations</span>
              <span className="text-purple-400 text-xs">{tools.length} connected</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {tools.slice(0, 3).map((tool, index) => (
                <motion.span
                  key={`${String(tool)}-${index}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                >
                  {String(tool)}
                </motion.span>
              ))}
              {tools.length > 3 && (
                <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full border border-gray-500/30">
                  +{tools.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar (when executing) */}
          {status === 'executing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3"
            >
              <div className="w-full bg-white/10 rounded-full h-1">
                <motion.div
                  className="h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
            </motion.div>
          )}

          {/* Completed State */}
          {status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Agent completed successfully</span>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2 text-red-400">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-medium">Agent execution failed</span>
              </div>
            </motion.div>
          )}

          {/* Performance Metrics */}
          {performance && (isHovered || selected) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <h5 className="text-sm font-medium text-white mb-2 flex items-center">
                <BarChart className="w-4 h-4 mr-2 text-blue-400" />
                Performance Metrics
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 rounded p-2">
                  <div className="text-gray-400">Avg Response</div>
                  <div className="text-blue-400 font-medium">{String(performance.averageResponseTime)}ms</div>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <div className="text-gray-400">Success Rate</div>
                  <div className="text-green-400 font-medium">{String(performance.successRate)}%</div>
                </div>
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
                  aria-label="Start agent"
                >
                  <Play className="w-3 h-3 text-green-400" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-3 h-3 text-blue-400" />
                </motion.button>
              </div>
              
              <span className="text-xs text-gray-400">
                Agent ID: {String(label).toLowerCase().replace(/\s+/g, '-')}
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
        style={{ zIndex: 10 }}
      />

      {/* Connection Points Indicator */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -inset-2 border border-purple-400/30 rounded-2xl pointer-events-none"
        />
      )}
    </motion.div>
  );
});

AgentNode.displayName = 'AgentNode';