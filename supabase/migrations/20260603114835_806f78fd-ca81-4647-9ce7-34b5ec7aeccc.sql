
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.pipeline_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client TEXT NOT NULL,
  description TEXT NOT NULL,
  job_id TEXT NOT NULL,
  request_id TEXT,
  request_link TEXT,
  request_at TIMESTAMPTZ,
  quotation_number TEXT,
  quotation_date DATE,
  quotation_value_aoa NUMERIC,
  payment_terms TEXT,
  incoterms TEXT,
  quotation_status TEXT NOT NULL DEFAULT 'nao_emitido',
  order_number TEXT,
  order_content TEXT,
  order_date DATE,
  order_value_aoa NUMERIC,
  order_payment_terms TEXT,
  order_status TEXT NOT NULL DEFAULT 'nao_emitido',
  remarks TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_entries TO authenticated;
GRANT ALL ON public.pipeline_entries TO service_role;

ALTER TABLE public.pipeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipeline_entries_select_auth"
  ON public.pipeline_entries FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "pipeline_entries_insert_auth"
  ON public.pipeline_entries FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "pipeline_entries_update_auth"
  ON public.pipeline_entries FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "pipeline_entries_delete_auth"
  ON public.pipeline_entries FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER pipeline_entries_set_updated_at
  BEFORE UPDATE ON public.pipeline_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pipeline_entries_created_at ON public.pipeline_entries (created_at DESC);
CREATE INDEX idx_pipeline_entries_client ON public.pipeline_entries (client);
