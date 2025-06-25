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
  
  const { getNode, getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { addToHistory, setSelectedNode: storeSetSelectedNode } = useCanvasStore();
  
  // Open the node configuration panel
  const openNodeConfig = useCallback((nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      const typedNode = node as Node<NodeData>;
      setSelectedNode(typedNode);
      storeSetSelectedNode(typedNode);
      setIsNodeConfigOpen(true);
    }
  }, [getNode, storeSetSelectedNode]);

  // Close the node configuration panel
  const closeNodeConfig = useCallback(() => {
    setIsNodeConfigOpen(false);
    setSelectedNode(null);
    storeSetSelectedNode(null);
  }, []);

  // Update a node's data
  const updateNodeData = useCallback((
    nodeId: string, 
    newData: Partial<NodeData>
  ) => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    const updatedNodes = currentNodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data as NodeData,
            ...newData
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
    storeSetSelectedNode(null);
  }, [selectedNode, closeNodeConfig, addToHistory, storeSetSelectedNode, getNodes, getEdges, setNodes, setEdges]);

  return {
    selectedNode,
    isNodeConfigOpen,
    openNodeConfig,
    closeNodeConfig,
    updateNodeData,
    deleteNode
  };
}