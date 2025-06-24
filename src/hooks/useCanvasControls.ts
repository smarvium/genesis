import { useState, useCallback } from 'react';
import { Node, useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '../stores/canvasStore';
import { NodeData, CanvasEdge } from '../types/canvas';

/**
 * Hook for providing enhanced canvas control functionality
 */
export function useCanvasControls() {
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [isNodeConfigOpen, setIsNodeConfigOpen] = useState(false);
  
  const { getNode } = useReactFlow();
  const { addToHistory } = useCanvasStore();
  
  // Open the node configuration panel
  const openNodeConfig = useCallback((nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      setSelectedNode(node as Node<NodeData>);
      setIsNodeConfigOpen(true);
    }
  }, [getNode]);

  // Close the node configuration panel
  const closeNodeConfig = useCallback(() => {
    setIsNodeConfigOpen(false);
    setSelectedNode(null);
  }, []);

  // Update a node's data
  const updateNodeData = useCallback((
    nodeId: string, 
    data: Partial<NodeData>
  ) => {
    const { getNodes, getEdges, setNodes } = useReactFlow();
    
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    const updatedNodes = currentNodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...data
          }
        };
      }
      return node;
    });
    
    setNodes(updatedNodes);
    addToHistory(updatedNodes as Node<NodeData>[], currentEdges as CanvasEdge[]);
    
    return updatedNodes.find(node => node.id === nodeId);
  }, [addToHistory]);

  // Delete a node
  const deleteNode = useCallback((nodeId: string) => {
    const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
    
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    const updatedNodes = currentNodes.filter(node => node.id !== nodeId);
    const updatedEdges = currentEdges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
    
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    
    addToHistory(updatedNodes as Node<NodeData>[], updatedEdges as CanvasEdge[]);
    
    // Close the config panel if the deleted node is currently selected
    if (selectedNode?.id === nodeId) {
      closeNodeConfig();
    }
  }, [selectedNode, closeNodeConfig, addToHistory]);

  return {
    selectedNode,
    isNodeConfigOpen,
    openNodeConfig,
    closeNodeConfig,
    updateNodeData,
    deleteNode
  };
}