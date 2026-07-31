'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  projectIssueApi,
  CreateIssueRequest,
  UpdateIssueRequest,
  QueryIssuesParams,
} from '@/lib/api/project-issue.api';

const CACHE_KEYS = {
  issues: (projectId: string, params?: QueryIssuesParams) => [
    'projects',
    projectId,
    'issues',
    params ?? {},
  ],
  statusReport: (projectId: string, issuesTaskId?: string) => [
    'projects',
    projectId,
    'status-report',
    issuesTaskId ?? null,
  ],
};

export function useProjectIssues(
  projectId: string | null,
  params?: QueryIssuesParams
) {
  return useQuery({
    queryKey: CACHE_KEYS.issues(projectId || '', params),
    queryFn: () => projectIssueApi.list(projectId!, params),
    enabled: !!projectId,
  });
}

export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIssueRequest) =>
      projectIssueApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'issues'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'status-report'] });
    },
  });
}

export function useUpdateIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      ...data
    }: UpdateIssueRequest & { issueId: string }) =>
      projectIssueApi.update(projectId, issueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'issues'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'status-report'] });
    },
  });
}

export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issueId: string) => projectIssueApi.remove(projectId, issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'issues'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'status-report'] });
    },
  });
}

export function useStatusReport(projectId: string | null, issuesTaskId?: string) {
  return useQuery({
    queryKey: CACHE_KEYS.statusReport(projectId || '', issuesTaskId),
    queryFn: () => projectIssueApi.getStatusReport(projectId!, issuesTaskId),
    enabled: !!projectId,
  });
}
