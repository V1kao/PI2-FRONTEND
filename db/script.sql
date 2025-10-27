CREATE TABLE usuario (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(200) NOT NULL,           
    role VARCHAR(50) NOT NULL,
    fk_empresa UUID NOT NULL                               
);

CREATE TABLE empresa (
    id UUID PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    razao_social VARCHAR(150)  NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    telefone VARCHAR(20) NOT NULL
);

CREATE TABLE endereco (
    id UUID PRIMARY KEY,
    logradouro VARCHAR(150) NOT NULL,
    numero INTEGER NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cep CHAR(8) NOT NULL,         
    cidade VARCHAR(100) NOT NULL, 
    uf CHAR(2) NOT NULL,              
    complemento VARCHAR(150),  
    fk_empresa UUID NOT NULL        
);

CREATE TABLE setor (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(150),
    fk_empresa UUID NOT NULL
);

CREATE TABLE sala (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(150),
    fk_setor UUID NOT NULL,
    fk_empresa UUID NOT NULL
);

CREATE TABLE dispositivo (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    potencia REAL NOT NULL,
    fk_tipo_dispositivo UUID NOT NULL,
    fk_empresa UUID NOT NULL
);

CREATE TABLE dispositivo_sala (
    id UUID PRIMARY KEY,
    apelido VARCHAR(100) NOT NULL,
    tempo_medio_hora FLOAT,
    fk_sala UUID NOT NULL,
    fk_dispositivo UUID NOT NULL,
    fk_empresa UUID NOT NULL
);

CREATE TABLE consumo (
    id UUID,
    event_time TIMESTAMPTZ NOT NULL,
    corrente REAL NOT NULL,
    tensao REAL NOT NULL,
    potencia_ativa REAL NOT NULL,
    fk_dispositivo_sala UUID NOT NULL,
    PRIMARY KEY(id,event_time) 
);

CREATE TABLE tipo_dispositivo (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    fk_empresa UUID NOT NULL
);


ALTER TABLE empresa
    ADD CONSTRAINT uq_empresa_cnpj UNIQUE (cnpj);

ALTER TABLE endereco
    ADD CONSTRAINT fk_endereco_empresa FOREIGN KEY (fk_empresa)
        REFERENCES empresa(id) ON DELETE CASCADE;
 
ALTER TABLE usuario
    ADD CONSTRAINT uq_usuario_email UNIQUE (email),
    ADD CONSTRAINT fk_usuario_empresa FOREIGN KEY (fk_empresa)
        REFERENCES empresa(id) ON DELETE CASCADE;

ALTER TABLE setor 
    ADD CONSTRAINT fk_setor_empresa FOREIGN KEY (fk_empresa)
        REFERENCES empresa(id) ON DELETE CASCADE,
    ADD CONSTRAINT uq_setor_nome UNIQUE (nome, fk_empresa);


ALTER TABLE sala
    ADD CONSTRAINT fk_sala_setor FOREIGN KEY (fk_setor)
        REFERENCES setor(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_sala_empresa FOREIGN KEY (fk_empresa)
        REFERENCES empresa(id) ON DELETE CASCADE,
    ADD CONSTRAINT uq_sala_setor UNIQUE (nome, fk_setor);   

ALTER TABLE tipo_dispositivo 
    ADD CONSTRAINT fk_tipo_dispositivo_empresa FOREIGN KEY (fk_empresa)
        REFERENCES empresa(id) ON DELETE CASCADE,
    ADD CONSTRAINT uq_tipo_dispositivo_nome UNIQUE (nome,fk_empresa);

ALTER TABLE dispositivo 
    ADD CONSTRAINT fk_dispositivo_tipo FOREIGN KEY (fk_tipo_dispositivo)
        REFERENCES tipo_dispositivo(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_dispositivo_empresa FOREIGN KEY (fk_empresa)
        REFERENCES empresa(id) ON DELETE CASCADE,
    ADD CONSTRAINT uq_dispositivo_nome UNIQUE (nome, fk_empresa);

ALTER TABLE dispositivo_sala
    ADD CONSTRAINT fk_ds_sala FOREIGN KEY (fk_sala)
        REFERENCES sala(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ds_dispositivo FOREIGN KEY (fk_dispositivo) 
        REFERENCES dispositivo(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ds_empresa FOREIGN KEY (fk_empresa)
        REFERENCES empresa(id) ON DELETE CASCADE,
    ADD CONSTRAINT uq_ds_sala UNIQUE (apelido, fk_sala);

ALTER TABLE consumo
    ADD CONSTRAINT fk_consumo_dispositivo FOREIGN KEY (fk_dispositivo_sala)
        REFERENCES dispositivo_sala(id) ON DELETE CASCADE;
  

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ========================================
-- CRIAR HYPERTABLE
-- ========================================
SELECT create_hypertable('consumo', 'event_time', if_not_exists => TRUE);

-- ========================================
-- ÍNDICES NA HYPERTABLE (corrigidos)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_consumo_dispositivo_sala 
    ON consumo (fk_dispositivo_sala, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_consumo_event_time 
    ON consumo (event_time DESC);

CREATE INDEX IF NOT EXISTS idx_consumo_fk_dispositivo_sala_event_time
    ON consumo (fk_dispositivo_sala, event_time DESC)
    INCLUDE (potencia_ativa, corrente, tensao);

-- ========================================
-- ÍNDICES ADICIONAIS PARA MULTI-TENANT
-- ========================================
CREATE INDEX IF NOT EXISTS idx_dispositivo_sala_empresa_sala 
    ON dispositivo_sala (fk_empresa, fk_sala);

CREATE INDEX IF NOT EXISTS idx_dispositivo_sala_empresa 
    ON dispositivo_sala (fk_empresa);

-- ========================================
-- CONFIGURAR COMPRESSÃO
-- ========================================
ALTER TABLE consumo SET (
    timescaledb.compress,
    timescaledb.compress_orderby = 'event_time DESC',
    timescaledb.compress_segmentby = 'fk_dispositivo_sala'
);

SELECT add_compression_policy('consumo', INTERVAL '30 days');

-- ========================================
-- CONFIGURAR CHUNK TIME INTERVAL
-- ========================================
SELECT set_chunk_time_interval('consumo', INTERVAL '14 days');

-- ========================================
-- VIEWS HORARIAS
-- ========================================

-- ========================================
-- CONSUMO HORÁRIO POR DISPOSITIVO-SALA
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_hourly_device_room CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_hourly_device_room
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', c.event_time) AS hour,
    ds.fk_empresa,
    c.fk_dispositivo_sala,
    SUM(c.potencia_ativa) AS total_potencia,
    AVG(c.potencia_ativa) AS avg_potencia,
    MAX(c.potencia_ativa) AS max_potencia,
    MIN(c.potencia_ativa) AS min_potencia
FROM consumo c
JOIN dispositivo_sala ds ON c.fk_dispositivo_sala = ds.id
GROUP BY hour, ds.fk_empresa, c.fk_dispositivo_sala
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_hourly_device_room_empresa_hour
    ON consumo_hourly_device_room (fk_empresa, hour DESC);

SELECT add_continuous_aggregate_policy('consumo_hourly_device_room',
    start_offset => INTERVAL '48 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes');

-- ========================================
-- CONSUMO HORÁRIO POR SALA
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_hourly_room CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_hourly_room
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', c.event_time) AS hour,
    ds.fk_empresa,
    ds.fk_sala,
    SUM(c.potencia_ativa) AS total_potencia,
    AVG(c.potencia_ativa) AS avg_potencia,
    MAX(c.potencia_ativa) AS max_potencia,
    MIN(c.potencia_ativa) AS min_potencia,
    COUNT(*) AS total_leituras
FROM consumo c
JOIN dispositivo_sala ds ON c.fk_dispositivo_sala = ds.id
GROUP BY hour, ds.fk_empresa, ds.fk_sala
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_hourly_room_empresa_hour
    ON consumo_hourly_room (fk_empresa, hour DESC);

SELECT add_continuous_aggregate_policy('consumo_hourly_room',
    start_offset => INTERVAL '48 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes');

-- ========================================
-- CONSUMO HORÁRIO POR SETOR
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_hourly_department CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_hourly_department
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', c.event_time) AS hour,
    e.id AS fk_empresa,
    s.id AS fk_setor,
    SUM(c.potencia_ativa) AS total_potencia,
    AVG(c.potencia_ativa) AS avg_potencia,
    MAX(c.potencia_ativa) AS max_potencia,
    MIN(c.potencia_ativa) AS min_potencia,
    COUNT(*) AS total_leituras
FROM consumo c
JOIN dispositivo_sala ds ON c.fk_dispositivo_sala = ds.id
JOIN sala s ON ds.fk_sala = s.id
JOIN setor se ON s.fk_setor = se.id
JOIN empresa e ON se.fk_empresa = e.id
GROUP BY hour, e.id, s.id
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_hourly_department_empresa_hour
    ON consumo_hourly_department (fk_empresa, hour DESC);

SELECT add_continuous_aggregate_policy('consumo_hourly_department',
    start_offset => INTERVAL '48 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes');

-- ========================================
-- VIEWS DIARIAS
-- ========================================    
    
-- ========================================
-- CONSUMO DIÁRIO POR DISPOSITIVO-SALA
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_daily_device_room CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_daily_device_room
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', hour) AS day,
    fk_empresa,
    fk_dispositivo_sala,
    SUM(total_potencia) AS total_potencia,
    AVG(avg_potencia) AS avg_potencia,
    MAX(max_potencia) AS max_potencia,
    MIN(min_potencia) AS min_potencia,
    SUM(1) AS total_leituras
FROM consumo_hourly_device_room
GROUP BY time_bucket('1 day', hour), fk_empresa, fk_dispositivo_sala
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_daily_device_room_empresa_day
    ON consumo_daily_device_room (fk_empresa, day DESC);

SELECT add_continuous_aggregate_policy('consumo_daily_device_room',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 hour');

-- ========================================
-- CONSUMO DIÁRIO POR SALA
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_daily_room CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_daily_room
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', hour) AS day,
    fk_empresa,
    fk_sala,
    SUM(total_potencia) AS total_potencia,
    AVG(avg_potencia) AS avg_potencia,
    MAX(max_potencia) AS max_potencia,
    MIN(min_potencia) AS min_potencia
FROM consumo_hourly_room
GROUP BY time_bucket('1 day', hour), fk_empresa, fk_sala
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_daily_room_empresa_day
    ON consumo_daily_room (fk_empresa, day DESC);

SELECT add_continuous_aggregate_policy('consumo_daily_room',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 hour');

-- ========================================
-- CONSUMO DIÁRIO POR SETOR
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_daily_department CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_daily_department
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', hour) AS day,
    fk_empresa,
    fk_setor,
    SUM(total_potencia) AS total_potencia,
    AVG(avg_potencia) AS avg_potencia,
    MAX(max_potencia) AS max_potencia,
    MIN(min_potencia) AS min_potencia
FROM consumo_hourly_department
GROUP BY time_bucket('1 day', hour), fk_empresa, fk_setor
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_daily_department_empresa_day
    ON consumo_daily_department (fk_empresa, day DESC);

SELECT add_continuous_aggregate_policy('consumo_daily_department',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 hour');
    
-- ========================================
-- VIEWS SEMANAIS
-- ========================================

-- ========================================
-- CONSUMO SEMANAL POR DISPOSITIVO-SALA
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_weekly_device_room CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_weekly_device_room
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 week', day) AS week,
    fk_empresa,
    fk_dispositivo_sala,
    SUM(total_potencia) AS total_potencia,
    AVG(avg_potencia) AS avg_potencia,
    MAX(max_potencia) AS max_potencia,
    MIN(min_potencia) AS min_potencia,
    SUM(total_leituras) AS total_leituras
FROM consumo_daily_device_room
GROUP BY time_bucket('1 week', day), fk_empresa, fk_dispositivo_sala
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_weekly_device_room_empresa_week
    ON consumo_weekly_device_room (fk_empresa, week DESC);

SELECT add_continuous_aggregate_policy('consumo_weekly_device_room',
    start_offset => INTERVAL '4 weeks',
    end_offset => INTERVAL '1 week',
    schedule_interval => INTERVAL '6 hours');

-- ========================================
-- CONSUMO SEMANAL POR SALA
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_weekly_room CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_weekly_room
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 week', day) AS week,
    fk_empresa,
    fk_sala,
    SUM(total_potencia) AS total_potencia,
    AVG(avg_potencia) AS avg_potencia,
    MAX(max_potencia) AS max_potencia,
    MIN(min_potencia) AS min_potencia
FROM consumo_daily_room
GROUP BY time_bucket('1 week', day), fk_empresa, fk_sala
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_weekly_room_empresa_week
    ON consumo_weekly_room (fk_empresa, week DESC);

SELECT add_continuous_aggregate_policy('consumo_weekly_room',
    start_offset => INTERVAL '4 weeks',
    end_offset => INTERVAL '1 week',
    schedule_interval => INTERVAL '6 hours');

-- ========================================
-- CONSUMO SEMANAL POR SETOR
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_weekly_department CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_weekly_department
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 week', day) AS week,
    fk_empresa,
    fk_setor,
    SUM(total_potencia) AS total_potencia,
    AVG(avg_potencia) AS avg_potencia,
    MAX(max_potencia) AS max_potencia,
    MIN(min_potencia) AS min_potencia
FROM consumo_daily_department
GROUP BY time_bucket('1 week', day), fk_empresa, fk_setor
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_weekly_department_empresa_week
    ON consumo_weekly_department (fk_empresa, week DESC);

SELECT add_continuous_aggregate_policy('consumo_weekly_department',
    start_offset => INTERVAL '4 weeks',
    end_offset => INTERVAL '1 week',
    schedule_interval => INTERVAL '6 hours');

-- ========================================
-- VIEWS MENSAIS
-- ========================================

-- ========================================
-- CONSUMO MENSAL POR DISPOSITIVO-SALA
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_monthly_device_room CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_monthly_device_room
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 month', day) AS month,
    fk_empresa,
    fk_dispositivo_sala,
    SUM(total_potencia) AS total_potencia,
    AVG(avg_potencia) AS avg_potencia,
    MAX(max_potencia) AS max_potencia,
    MIN(min_potencia) AS min_potencia,
    SUM(total_leituras) AS total_leituras
FROM consumo_daily_device_room
GROUP BY time_bucket('1 month', day), fk_empresa, fk_dispositivo_sala
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_monthly_device_room_empresa_month
    ON consumo_monthly_device_room (fk_empresa, month DESC);

SELECT add_continuous_aggregate_policy('consumo_monthly_device_room',
    start_offset => INTERVAL '3 months',
    end_offset => INTERVAL '1 month',
    schedule_interval => INTERVAL '12 hours');

-- ========================================
-- CONSUMO MENSAL POR SALA
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_monthly_room CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_monthly_room
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 month', day) AS month,
    fk_empresa,
    fk_sala,
    SUM(total_potencia) AS total_potencia,
    AVG(avg_potencia) AS avg_potencia,
    MAX(max_potencia) AS max_potencia,
    MIN(min_potencia) AS min_potencia
FROM consumo_daily_room
GROUP BY time_bucket('1 month', day), fk_empresa, fk_sala
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_monthly_room_empresa_month
    ON consumo_monthly_room (fk_empresa, month DESC);

SELECT add_continuous_aggregate_policy('consumo_monthly_room',
    start_offset => INTERVAL '3 months',
    end_offset => INTERVAL '1 month',
    schedule_interval => INTERVAL '12 hours');

-- ========================================
-- CONSUMO MENSAL POR SETOR
-- ========================================
DROP MATERIALIZED VIEW IF EXISTS consumo_monthly_department CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS consumo_monthly_department
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 month', day) AS month,
    fk_empresa,
    fk_setor,
    SUM(total_potencia) AS total_potencia,
    AVG(avg_potencia) AS avg_potencia,
    MAX(max_potencia) AS max_potencia,
    MIN(min_potencia) AS min_potencia
FROM consumo_daily_department
GROUP BY time_bucket('1 month', day), fk_empresa, fk_setor
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_consumo_monthly_department_empresa_month
    ON consumo_monthly_department (fk_empresa, month DESC);

SELECT add_continuous_aggregate_policy('consumo_monthly_department',
    start_offset => INTERVAL '3 months',
    end_offset => INTERVAL '1 month',
    schedule_interval => INTERVAL '12 hours');