"""
PostgreSQL schema extraction queries.
Based on the tested schema files in /schema/ folder.
"""
POSTGRES_SCHEMA_QUERIES = {
    "full_schema": """
        WITH
        columns_info AS (
          SELECT 
            table_name,
            'Table: ' || table_name || E'\n' ||
            string_agg(
              '  Column: ' || column_name || ' ' || data_type ||
              CASE WHEN character_maximum_length IS NOT NULL 
                   THEN '(' || character_maximum_length || ')' ELSE '' END ||
              CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE ' NULL' END,
              E'\n'
              ORDER BY ordinal_position
            ) AS schema_line
          FROM information_schema.columns
          WHERE table_schema = 'public'
          GROUP BY table_name
        ),
        pk_info AS (
          SELECT 
            'Primary Key: ' || kc.table_name || '.' || kc.column_name AS schema_line
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kc 
            ON tc.constraint_name = kc.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
        ),
        fk_info AS (
          SELECT 
            'Foreign Key: ' || kcu.table_name || '.' || kcu.column_name ||
            ' -> ' || ccu.table_name || '.' || ccu.column_name AS schema_line
          FROM information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON tc.constraint_name = ccu.constraint_name
          WHERE constraint_type = 'FOREIGN KEY'
        ),
        index_info AS (
          SELECT 
            'Index: ' || t.relname || '.' || a.attname ||
            CASE WHEN ix.indisunique THEN ' (UNIQUE)' ELSE '' END AS schema_line
          FROM pg_class t
          JOIN pg_index ix ON t.oid = ix.indrelid
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
          WHERE t.relkind = 'r'
        ),
        constraint_info AS (
          SELECT
            'Constraint: ' || tc.table_name || '.' || tc.constraint_name ||
            ' (' || tc.constraint_type || ')' ||
            CASE
              WHEN cc.check_clause IS NOT NULL THEN ' CHECK: ' || cc.check_clause
              ELSE ''
            END AS schema_line
          FROM information_schema.table_constraints tc
          LEFT JOIN information_schema.check_constraints cc
            ON tc.constraint_name = cc.constraint_name
          WHERE tc.constraint_type IN ('CHECK', 'UNIQUE')
            AND tc.table_schema = 'public'
        ),
        view_info AS (
          SELECT
            'View: ' || viewname || E'\n' ||
            '  Definition: ' || SUBSTRING(definition, 1, 200) ||
            CASE WHEN LENGTH(definition) > 200 THEN '...' ELSE '' END AS schema_line
          FROM pg_views
          WHERE schemaname = 'public'
        ),
        enum_info AS (
          SELECT
            'Enum: ' || t.typname || ' VALUES: ' ||
            string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS schema_line
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          JOIN pg_namespace n ON t.typnamespace = n.oid
          WHERE n.nspname = 'public'
          GROUP BY t.typname
        )
        SELECT
          string_agg(schema_line, E'\n') AS FullSchemaText
        FROM (
          SELECT schema_line FROM columns_info
          UNION ALL
          SELECT schema_line FROM pk_info
          UNION ALL
          SELECT schema_line FROM fk_info
          UNION ALL
          SELECT schema_line FROM index_info
          UNION ALL
          SELECT schema_line FROM constraint_info
          UNION ALL
          SELECT schema_line FROM view_info
          UNION ALL
          SELECT schema_line FROM enum_info
        ) all_parts;
    """,
    
    "tables": """
        SELECT 
            schemaname,
            tablename as table_name,
            tableowner as table_owner
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY schemaname, tablename
    """,
    
    "columns": """
        SELECT 
            c.table_schema,
            c.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            c.character_maximum_length,
            c.numeric_precision,
            c.numeric_scale,
            c.ordinal_position
        FROM information_schema.columns c
        WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY c.table_schema, c.table_name, c.ordinal_position
    """,
    
    "primary_keys": """
        SELECT 
            kcu.table_schema,
            kcu.table_name,
            kcu.column_name,
            kcu.ordinal_position
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.table_schema, kcu.table_name, kcu.ordinal_position
    """,
    
    "foreign_keys": """
        SELECT 
            tc.table_schema,
            tc.table_name,
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position
    """,
    
    "indexes": """
        SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
        FROM pg_indexes
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY schemaname, tablename, indexname
    """,
    
    "views": """
        SELECT 
            schemaname,
            viewname as view_name,
            viewowner as view_owner,
            definition
        FROM pg_views
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY schemaname, viewname
    """,
    
    "enums": """
        SELECT
            t.typname as enum_name,
            string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public'
        GROUP BY t.typname
        ORDER BY t.typname
    """,

    "procedures_list": """
        SELECT
            routine_name as procedure_name,
            routine_type as type
        FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_type IN ('PROCEDURE', 'FUNCTION')
        ORDER BY routine_name
    """,

    "procedure_definition": """
        SELECT
            routine_name as procedure_name,
            routine_type as type,
            routine_definition as definition,
            string_agg(
                parameter_name || ' ' ||
                COALESCE(data_type, udt_name) ||
                CASE WHEN parameter_mode IS NOT NULL THEN ' (' || parameter_mode || ')' ELSE '' END,
                ', '
                ORDER BY ordinal_position
            ) as parameters
        FROM information_schema.routines r
        LEFT JOIN information_schema.parameters p
            ON r.specific_name = p.specific_name
        WHERE r.routine_schema = 'public'
          AND r.routine_name = %s
        GROUP BY r.routine_name, r.routine_type, r.routine_definition
    """
}
