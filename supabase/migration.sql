-- YouTube Copy Tool 테이블 생성

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  title TEXT DEFAULT '새 프로젝트',
  status TEXT DEFAULT 'input' CHECK (status IN ('input', 'analyzing', 'topics_ready', 'generating', 'complete', 'confirmed', 'producing', 'production_done', 'uploading', 'uploaded', 'error')),
  video_urls TEXT[] DEFAULT '{}',
  analyzed_videos JSONB DEFAULT NULL,
  topics JSONB DEFAULT NULL,
  selected_topic_id TEXT DEFAULT NULL,
  generated_content JSONB DEFAULT NULL,
  confirmed_content JSONB DEFAULT NULL,
  production_assets JSONB DEFAULT NULL,
  error_message TEXT DEFAULT NULL
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS (Row Level Security) - 필요시 활성화
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
