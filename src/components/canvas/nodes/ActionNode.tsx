import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Settings, Mail, Database, Globe, MoreHorizontal, CheckCircle, Clock } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';

interface ActionNodeData {
  label: string;
  description: string;
  actionType: 'api' | 'email' | 'database' | 'webhook' | 'notification';
  icon: React.ComponentType<any>;
  color: string;
  config?: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'error';
}

// Create a type that extends NodeProps but with required width/height
type ActionNodeProps = NodeProps;

export const ActionNode = memo<ActionNodeProps>(({ data, selected }: ActionNodeProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-blue-400 shadow-blue-400/30';
      case 'executing': return 'border-yellow-400 shadow-yellow-400/30 animate-pulse';
      case 'completed': return 'border-green-400 shadow-green-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'database': return Database;
      case 'webhook': return Globe;
      case 'api': return Settings;
      default: return Settings;
    }
  };

  const ActionIcon = getActionIcon(data.actionType);

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
      />

      {/* Main Node */}
      <GlassCard 
        variant="medium" 
        className={`w-72 border-2 ${getStatusColor(data.status)} ${
          selected ? 'ring-2 ring-blue-400/50' : ''
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
                  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                />
                <ActionIcon className="w-6 h-6 text-white relative z-10" />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {data.label}
                </h3>
                <p className="text-blue-300 text-xs capitalize">
                  {data.actionType} action
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
                {data.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-400" />}
                {data.status === 'executing' && <Clock className="w-3 h-3 text-yellow-400 animate-spin" />}
                {data.status === 'pending' && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
                {data.status === 'error' && <div className="w-2 h-2 bg-red-400 rounded-full" />}
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

          {/* Action Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Action Details</span>
              <span className="text-blue-400 text-xs">
                {data.actionType === 'email' ? 'SMTP Configured' :
                 data.actionType === 'database' ? 'Connection Ready' :
                 data.actionType === 'webhook' ? 'Endpoint Active' :
                 'API Connected'}
              </span>
            </div>

            {/* Configuration Preview */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              {data.actionType === 'email' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Recipients</span>
                    <span className="text-xs text-white">3 contacts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Template</span>
                    <span className="text-xs text-white">Weekly Report</span>
                  </div>
                </div>
              )}

              {data.actionType === 'database' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Operation</span>
                    <span className="text-xs text-white">INSERT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Table</span>
                    <span className="text-xs text-white">reports</span>
                  </div>
                </div>
              )}

              {data.actionType === 'webhook' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Method</span>
                    <span className="text-xs text-white">POST</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Endpoint</span>
                    <span className="text-xs text-white">api.example.com</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {data.status === 'executing' && (
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
                <span>60%</span>
              </div>
            </motion.div>
          )}

          {/* Success Indicator */}
          {data.status === 'completed' && (
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
      />
    </motion.div>
  );
});