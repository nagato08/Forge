'use client';

import { useMutation } from '@tanstack/react-query';
import { aiApi, AIInterpretRequest, AIInterpretResponse, AIExecuteRequest, AIActRequest, AIAnalysisResponse } from '@/lib/api/ai.api';
import { getApiError } from '@/lib/utils/api-error';

/**
 * Hook pour interpréter un message IA (suggestion uniquement, pas d'exécution)
 */
export function useInterpretMessage() {
  return useMutation({
    mutationFn: (data: AIInterpretRequest) => aiApi.interpret(data),
    onSuccess: (response) => {
      console.log('✅ Message interpreted:', response.action);
    },
    onError: (error) => {
      console.error('❌ Interpret error:', getApiError(error));
    },
  });
}

/**
 * Hook pour exécuter une action suggérée
 */
export function useExecuteAction() {
  return useMutation({
    mutationFn: (data: AIExecuteRequest) => aiApi.execute(data),
    onSuccess: (result) => {
      console.log('✅ Action executed successfully:', result.id || 'unknown');
    },
    onError: (error) => {
      console.error('❌ Execute error:', getApiError(error));
    },
  });
}

/**
 * Hook pour interpréter et exécuter en une seule action
 */
export function useAIAct() {
  return useMutation({
    mutationFn: (data: AIActRequest) => aiApi.act(data),
    onSuccess: (response) => {
      console.log('✅ AI Act completed:', response.action);
    },
    onError: (error) => {
      console.error('❌ AI Act error:', getApiError(error));
    },
  });
}

/**
 * Hook pour analyser le diagramme Gantt
 */
export function useAnalyzeGantt(projectId: string | null) {
  return useMutation({
    mutationFn: () => aiApi.analyzeGantt(projectId!),
    onSuccess: (response) => {
      console.log('✅ Gantt analysis completed');
    },
    onError: (error) => {
      console.error('❌ Gantt analysis error:', getApiError(error));
    },
  });
}

/**
 * Hook pour analyser le diagramme PERT
 */
export function useAnalyzePert(projectId: string | null) {
  return useMutation({
    mutationFn: () => aiApi.analyzePert(projectId!),
    onSuccess: (response) => {
      console.log('✅ PERT analysis completed');
    },
    onError: (error) => {
      console.error('❌ PERT analysis error:', getApiError(error));
    },
  });
}

/**
 * Hook pour analyser les retards potentiels
 */
export function useAnalyzeDelays(projectId: string | null) {
  return useMutation({
    mutationFn: () => aiApi.analyzeDelays(projectId!),
    onSuccess: (response) => {
      console.log('✅ Delays analysis completed');
    },
    onError: (error) => {
      console.error('❌ Delays analysis error:', getApiError(error));
    },
  });
}
