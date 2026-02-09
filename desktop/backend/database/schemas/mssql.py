"""
MSSQL schema extraction queries.
Based on the tested schema files in /schema/ folder.
"""
MSSQL_SCHEMA_QUERIES = {
    "full_schema": """
        DECLARE @schemaText NVARCHAR(MAX) = '';

        SELECT @schemaText = @schemaText + CHAR(13) + 'Table: ' + t.TABLE_SCHEMA + '.' + t.TABLE_NAME + CHAR(13) +
        (
          SELECT STRING_AGG('  Column: ' + c.COLUMN_NAME + ' ' + c.DATA_TYPE +
                        COALESCE('(' + CAST(c.CHARACTER_MAXIMUM_LENGTH AS VARCHAR) + ')', '') +
                        CASE WHEN c.IS_NULLABLE = 'NO' THEN ' NOT NULL' ELSE ' NULL' END, CHAR(13))
          FROM INFORMATION_SCHEMA.COLUMNS c
          WHERE c.TABLE_NAME = t.TABLE_NAME AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
        ) + CHAR(13)
        FROM INFORMATION_SCHEMA.TABLES t
        WHERE t.TABLE_TYPE = 'BASE TABLE';

        -- Primary Keys
        SET @schemaText = @schemaText + CHAR(13) + 'Primary Keys:' + CHAR(13);
        SELECT @schemaText = @schemaText +
            '  ' + tc.TABLE_NAME + ' - ' + ku.COLUMN_NAME + CHAR(13)
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku 
            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY';

        -- Foreign Keys
        SET @schemaText = @schemaText + CHAR(13) + 'Foreign Keys:' + CHAR(13);
        SELECT @schemaText = @schemaText +
            '  ' + OBJECT_NAME(f.parent_object_id) + '.' + COL_NAME(fc.parent_object_id, fc.parent_column_id) + 
            ' -> ' + OBJECT_NAME(f.referenced_object_id) + '.' + COL_NAME(fc.referenced_object_id, fc.referenced_column_id) + CHAR(13)
        FROM sys.foreign_keys f
        JOIN sys.foreign_key_columns fc ON f.OBJECT_ID = fc.constraint_object_id;

        -- Indexes (Clustered and Non-Clustered)
        SET @schemaText = @schemaText + CHAR(13) + 'Indexes:' + CHAR(13);
        SELECT @schemaText = @schemaText +
            '  ' + t.name + ' - ' + ind.name + ' on [' + col.name + '] ' + 
            '(' + ind.type_desc + ')' +
            CASE WHEN ind.is_unique = 1 THEN ' (UNIQUE)' ELSE '' END + CHAR(13)
        FROM sys.indexes ind 
        JOIN sys.index_columns ic ON ind.object_id = ic.object_id AND ind.index_id = ic.index_id
        JOIN sys.columns col ON ic.object_id = col.object_id AND ic.column_id = col.column_id
        JOIN sys.tables t ON ind.object_id = t.object_id
        WHERE ind.is_primary_key = 0 AND ind.type > 0;

        -- Constraints (Check, Unique, Default)
        SET @schemaText = @schemaText + CHAR(13) + 'Constraints:' + CHAR(13);
        SELECT @schemaText = @schemaText +
            '  ' + tc.TABLE_NAME + '.' + tc.CONSTRAINT_NAME + 
            ' (' + tc.CONSTRAINT_TYPE + ')' +
            CASE 
                WHEN cc.CHECK_CLAUSE IS NOT NULL THEN ' CHECK: ' + cc.CHECK_CLAUSE
                ELSE ''
            END + CHAR(13)
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        LEFT JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc 
            ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE IN ('CHECK', 'UNIQUE');

        -- Default Constraints
        SELECT @schemaText = @schemaText +
            '  ' + OBJECT_NAME(dc.parent_object_id) + '.' + COL_NAME(dc.parent_object_id, dc.parent_column_id) +
            ' DEFAULT: ' + dc.definition + CHAR(13)
        FROM sys.default_constraints dc;

        -- Views
        SET @schemaText = @schemaText + CHAR(13) + 'Views:' + CHAR(13);
        SELECT @schemaText = @schemaText +
            '  View: ' + TABLE_SCHEMA + '.' + TABLE_NAME + CHAR(13) +
            '  Definition: ' + SUBSTRING(VIEW_DEFINITION, 1, 200) +
            CASE WHEN LEN(VIEW_DEFINITION) > 200 THEN '...' ELSE '' END + CHAR(13)
        FROM INFORMATION_SCHEMA.VIEWS;

        -- Enums (CHECK constraints with IN clause)
        SET @schemaText = @schemaText + CHAR(13) + 'Enums (CHECK constraints):' + CHAR(13);
        SELECT @schemaText = @schemaText +
            '  Enum: ' + OBJECT_NAME(cc.parent_object_id) + '.' + COL_NAME(cc.parent_object_id, cc.parent_column_id) +
            ' VALUES: ' + cc.definition + CHAR(13)
        FROM sys.check_constraints cc
        WHERE cc.definition LIKE '%IN%(%';

        SELECT FullSchemaText = @schemaText
    """,
    
    "tables": """
        SELECT 
            TABLE_SCHEMA as schema_name,
            TABLE_NAME as table_name
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
    """,
    
    "columns": """
        SELECT 
            TABLE_SCHEMA as schema_name,
            TABLE_NAME as table_name,
            COLUMN_NAME as column_name,
            DATA_TYPE as data_type,
            CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
            IS_NULLABLE as is_nullable,
            COLUMN_DEFAULT as column_default,
            ORDINAL_POSITION as ordinal_position
        FROM INFORMATION_SCHEMA.COLUMNS
        ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
    """,
    
    "primary_keys": """
        SELECT 
            tc.TABLE_SCHEMA as schema_name,
            tc.TABLE_NAME as table_name,
            ku.COLUMN_NAME as column_name
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku 
            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
        ORDER BY tc.TABLE_SCHEMA, tc.TABLE_NAME
    """,
    
    "foreign_keys": """
        SELECT 
            OBJECT_NAME(f.parent_object_id) as table_name,
            COL_NAME(fc.parent_object_id, fc.parent_column_id) as column_name,
            OBJECT_NAME(f.referenced_object_id) as foreign_table_name,
            COL_NAME(fc.referenced_object_id, fc.referenced_column_id) as foreign_column_name
        FROM sys.foreign_keys f
        JOIN sys.foreign_key_columns fc ON f.OBJECT_ID = fc.constraint_object_id
        ORDER BY OBJECT_NAME(f.parent_object_id)
    """,
    
    "indexes": """
        SELECT 
            t.name as table_name,
            ind.name as index_name,
            col.name as column_name,
            CASE WHEN ind.is_unique = 1 THEN 'UNIQUE' ELSE 'NON_UNIQUE' END as index_type
        FROM sys.indexes ind 
        JOIN sys.index_columns ic ON ind.object_id = ic.object_id AND ind.index_id = ic.index_id
        JOIN sys.columns col ON ic.object_id = col.object_id AND ic.column_id = col.column_id
        JOIN sys.tables t ON ind.object_id = t.object_id
        WHERE ind.is_primary_key = 0
        ORDER BY t.name, ind.name
    """,
    
    "views": """
        SELECT 
            TABLE_SCHEMA as schema_name,
            TABLE_NAME as view_name
        FROM INFORMATION_SCHEMA.VIEWS
        ORDER BY TABLE_SCHEMA, TABLE_NAME
    """,
    
    "vector_columns": """
        SELECT 
            TABLE_SCHEMA as schema_name,
            TABLE_NAME as table_name,
            COLUMN_NAME as column_name,
            DATA_TYPE as data_type,
            CHARACTER_MAXIMUM_LENGTH as max_length
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE UPPER(DATA_TYPE) = 'VECTOR'
        ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
    """,
    
    "enums": """
        SELECT
            OBJECT_NAME(cc.parent_object_id) + '.' + COL_NAME(cc.parent_object_id, cc.parent_column_id) as enum_name,
            cc.definition as enum_values
        FROM sys.check_constraints cc
        WHERE cc.definition LIKE '%IN%(%'
        ORDER BY OBJECT_NAME(cc.parent_object_id), COL_NAME(cc.parent_object_id, cc.parent_column_id)
    """,

    "procedures_list": """
        SELECT
            ROUTINE_NAME as procedure_name,
            ROUTINE_TYPE as type
        FROM INFORMATION_SCHEMA.ROUTINES
        WHERE ROUTINE_TYPE IN ('PROCEDURE', 'FUNCTION')
        ORDER BY ROUTINE_NAME
    """,

    "procedure_definition": """
        SELECT
            r.ROUTINE_NAME as procedure_name,
            r.ROUTINE_TYPE as type,
            r.ROUTINE_DEFINITION as definition,
            (
                SELECT STRING_AGG(
                    p.PARAMETER_NAME + ' ' + p.DATA_TYPE +
                    CASE WHEN p.PARAMETER_MODE IS NOT NULL THEN ' (' + p.PARAMETER_MODE + ')' ELSE '' END,
                    ', '
                )
                FROM INFORMATION_SCHEMA.PARAMETERS p
                WHERE p.SPECIFIC_NAME = r.SPECIFIC_NAME
            ) as parameters
        FROM INFORMATION_SCHEMA.ROUTINES r
        WHERE r.ROUTINE_NAME = @procedure_name
    """
}
