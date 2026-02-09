"""
MySQL schema extraction queries.
Based on the tested schema files in /schema/ folder.
"""
MYSQL_SCHEMA_QUERIES = {
    "full_schema": """
        SELECT 
          COALESCE(GROUP_CONCAT(schema_line ORDER BY sort_order SEPARATOR '\\n'), 'No schema found') AS FullSchemaText
        FROM (
          -- Tables and Columns
          SELECT 
            1 as sort_order,
            CONCAT('Table: ', TABLE_NAME, '\\n', 
                   GROUP_CONCAT(
                     CONCAT('  Column: ', COLUMN_NAME, ' ', COLUMN_TYPE,
                            IF(IS_NULLABLE = 'NO', ' NOT NULL', ' NULL'),
                            IF(COLUMN_DEFAULT IS NOT NULL, CONCAT(' DEFAULT ', COLUMN_DEFAULT), ''),
                            IF(EXTRA != '', CONCAT(' ', EXTRA), '')
                           ) 
                     ORDER BY ORDINAL_POSITION SEPARATOR '\\n'
                   )
            ) AS schema_line
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          GROUP BY TABLE_NAME

          UNION ALL

          -- Primary Keys
          SELECT 
            2 as sort_order,
            CONCAT('Primary Key: ', TABLE_NAME, '.', COLUMN_NAME) AS schema_line
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE CONSTRAINT_NAME = 'PRIMARY' AND TABLE_SCHEMA = DATABASE()

          UNION ALL

          -- Foreign Keys
          SELECT 
            3 as sort_order,
            CONCAT('Foreign Key: ', TABLE_NAME, '.', COLUMN_NAME, ' -> ', 
                   REFERENCED_TABLE_NAME, '.', REFERENCED_COLUMN_NAME) AS schema_line
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_SCHEMA = DATABASE()

          UNION ALL

          -- Indexes
          SELECT 
            4 as sort_order,
            CONCAT('Index: ', TABLE_NAME, '.', INDEX_NAME, ' ON ', COLUMN_NAME,
                   IF(MAX(NON_UNIQUE) = 0, ' (UNIQUE)', '')) AS schema_line
          FROM INFORMATION_SCHEMA.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME != 'PRIMARY'
          GROUP BY TABLE_NAME, INDEX_NAME, COLUMN_NAME

          UNION ALL

          -- Constraints
          SELECT
            5 as sort_order,
            CONCAT('Constraint: ', TABLE_NAME, '.', CONSTRAINT_NAME,
                   ' (', CONSTRAINT_TYPE, ')') AS schema_line
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA = DATABASE()
            AND CONSTRAINT_TYPE IN ('CHECK', 'UNIQUE')

          UNION ALL

          -- Views
          SELECT
            6 as sort_order,
            CONCAT('View: ', TABLE_NAME, '\\n',
                   '  Definition: ', SUBSTRING(VIEW_DEFINITION, 1, 200),
                   IF(LENGTH(VIEW_DEFINITION) > 200, '...', '')) AS schema_line
          FROM INFORMATION_SCHEMA.VIEWS
          WHERE TABLE_SCHEMA = DATABASE()

          UNION ALL

          -- Enums
          SELECT
            7 as sort_order,
            CONCAT('Enum: ', table_name, '.', column_name, ' VALUES: ',
                   SUBSTRING(column_type, 6, LENGTH(column_type) - 6)) AS schema_line
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND DATA_TYPE = 'enum'
        ) AS combined_schema;
    """,
    
    "tables": """
        SELECT 
            table_schema,
            table_name,
            table_type,
            engine,
            table_rows,
            data_length,
            index_length
        FROM information_schema.tables
        WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
        ORDER BY table_schema, table_name
    """,
    
    "columns": """
        SELECT 
            table_schema,
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            ordinal_position,
            column_type,
            extra
        FROM information_schema.columns
        WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
        ORDER BY table_schema, table_name, ordinal_position
    """,
    
    "primary_keys": """
        SELECT 
            table_schema,
            table_name,
            column_name,
            ordinal_position
        FROM information_schema.key_column_usage
        WHERE constraint_name = 'PRIMARY'
        ORDER BY table_schema, table_name, ordinal_position
    """,
    
    "foreign_keys": """
        SELECT 
            tc.table_schema,
            tc.table_name,
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            kcu.column_name AS foreign_column_name,
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
            table_schema,
            table_name,
            index_name,
            column_name,
            seq_in_index,
            non_unique,
            index_type
        FROM information_schema.statistics
        WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
        ORDER BY table_schema, table_name, index_name, seq_in_index
    """,
    
    "views": """
        SELECT 
            table_schema,
            table_name,
            view_definition,
            check_option,
            is_updatable
        FROM information_schema.views
        WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
        ORDER BY table_schema, table_name
    """,
    
    "enums": """
        SELECT DISTINCT
            CONCAT(table_name, '.', column_name) as enum_name,
            SUBSTRING(column_type, 6, LENGTH(column_type) - 6) as enum_values
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND data_type = 'enum'
        ORDER BY table_name, column_name
    """,

    "procedures_list": """
        SELECT
            routine_name as procedure_name,
            routine_type as type
        FROM information_schema.routines
        WHERE routine_schema = DATABASE()
          AND routine_type IN ('PROCEDURE', 'FUNCTION')
        ORDER BY routine_name
    """,

    "procedure_definition": """
        SELECT
            r.routine_name as procedure_name,
            r.routine_type as type,
            r.routine_definition as definition,
            GROUP_CONCAT(
                CONCAT(p.parameter_name, ' ', p.data_type,
                       IF(p.parameter_mode IS NOT NULL, CONCAT(' (', p.parameter_mode, ')'), ''))
                ORDER BY p.ordinal_position SEPARATOR ', '
            ) as parameters
        FROM information_schema.routines r
        LEFT JOIN information_schema.parameters p
            ON r.specific_name = p.specific_name
        WHERE r.routine_schema = DATABASE()
          AND r.routine_name = %s
        GROUP BY r.routine_name, r.routine_type, r.routine_definition
    """
}
