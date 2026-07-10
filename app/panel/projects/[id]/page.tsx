'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { ProjectEditor } from '@/components/ProjectEditor';
import { ProjectState, AiCommandPlan, DeviceMode } from '@/types/project';

type ProjectRow = { id: string; name: string; project_state: ProjectState; owner_id: string };

export default function ProjectEditorPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mode = (search.get('mode') === 'mobile' ? 'mobile' : 'pc') as DeviceMode;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from('projects').select('*').eq('id', params.id).is('deleted_at', null).maybeSingle();
      if (error) setError(error.message);
      else setProject(data as ProjectRow | null);
      setLoading(false);
    }
    load();
  }, [params.id]);

  const save = async (state: ProjectState, changeLabel = 'Manuel kayıt', aiPlan: AiCommandPlan | null = null, beforeState?: ProjectState) => {
    if (!project || !user) return;
    const { error } = await supabase.from('projects').update({
      name: state.name,
      project_state: state,
      updated_at: new Date().toISOString()
    }).eq('id', project.id);
    if (error) throw error;
    await supabase.from('project_changes').insert({
      project_id: project.id,
      user_id: user.id,
      change_type: aiPlan ? 'ai_apply' : 'manual_save',
      prompt: changeLabel,
      ai_plan: aiPlan,
      before_state: beforeState || project.project_state,
      after_state: state
    });
    await supabase.from('project_backups').insert({
      project_id: project.id,
      created_by: user.id,
      label: changeLabel,
      backup_state: state
    });
    setProject({ ...project, name: state.name, project_state: state });
  };

  if (loading) return <AppShell active="projects"><div className="main"><div className="notice">Proje yükleniyor...</div></div></AppShell>;
  if (error || !project) return <AppShell active="projects"><div className="main"><div className="notice danger">{error || 'Proje bulunamadı.'}</div><Link className="btn" href="/panel">Projelere dön</Link></div></AppShell>;
  return <ProjectEditor projectId={project.id} initialState={project.project_state} initialMode={mode} onSave={save} />;
}
