export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_bootstrap: {
        Row: {
          activation_hash: string
          created_at: string
          id: boolean
          used_at: string | null
        }
        Insert: {
          activation_hash: string
          created_at?: string
          id?: boolean
          used_at?: string | null
        }
        Update: {
          activation_hash?: string
          created_at?: string
          id?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      auditoria_dispositivos: {
        Row: {
          accion: string
          actor_dispositivo_id: string | null
          creado_at: string
          detalle: Json
          dispositivo_objetivo_id: string | null
          id: number
          negocio_id: string
        }
        Insert: {
          accion: string
          actor_dispositivo_id?: string | null
          creado_at?: string
          detalle?: Json
          dispositivo_objetivo_id?: string | null
          id?: never
          negocio_id: string
        }
        Update: {
          accion?: string
          actor_dispositivo_id?: string | null
          creado_at?: string
          detalle?: Json
          dispositivo_objetivo_id?: string | null
          id?: never
          negocio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_dispositivos_actor_dispositivo_id_fkey"
            columns: ["actor_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_dispositivos_dispositivo_objetivo_id_fkey"
            columns: ["dispositivo_objetivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_dispositivos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_catalogo: {
        Row: {
          activa: boolean
          actualizado_cliente_at: string
          actualizado_por_dispositivo_id: string
          creado_cliente_at: string
          eliminado_at: string | null
          id: string
          negocio_id: string
          nombre: string
          version: number
        }
        Insert: {
          activa?: boolean
          actualizado_cliente_at: string
          actualizado_por_dispositivo_id: string
          creado_cliente_at: string
          eliminado_at?: string | null
          id: string
          negocio_id: string
          nombre: string
          version?: number
        }
        Update: {
          activa?: boolean
          actualizado_cliente_at?: string
          actualizado_por_dispositivo_id?: string
          creado_cliente_at?: string
          eliminado_at?: string | null
          id?: string
          negocio_id?: string
          nombre?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "categorias_catalogo_actualizado_por_dispositivo_id_fkey"
            columns: ["actualizado_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_catalogo_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      cobros_ventas: {
        Row: {
          actualizado_at: string
          actualizado_por_dispositivo_id: string
          creado_at: string
          creado_por_dispositivo_id: string
          entidad: Json
          estado: string
          fecha_jornada: string
          id: string
          monto: number
          negocio_id: string
          venta_id: string
        }
        Insert: {
          actualizado_at?: string
          actualizado_por_dispositivo_id: string
          creado_at?: string
          creado_por_dispositivo_id: string
          entidad: Json
          estado: string
          fecha_jornada: string
          id: string
          monto: number
          negocio_id: string
          venta_id: string
        }
        Update: {
          actualizado_at?: string
          actualizado_por_dispositivo_id?: string
          creado_at?: string
          creado_por_dispositivo_id?: string
          entidad?: Json
          estado?: string
          fecha_jornada?: string
          id?: string
          monto?: number
          negocio_id?: string
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobros_ventas_actualizado_por_dispositivo_id_fkey"
            columns: ["actualizado_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_ventas_creado_por_dispositivo_id_fkey"
            columns: ["creado_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobros_ventas_negocio_id_venta_id_fkey"
            columns: ["negocio_id", "venta_id"]
            isOneToOne: false
            referencedRelation: "ventas_operativas"
            referencedColumns: ["negocio_id", "id"]
          },
        ]
      }
      codigos_emparejamiento: {
        Row: {
          codigo_hash: string
          creado_at: string
          creado_por_dispositivo_id: string
          id: string
          modo: string
          negocio_id: string
          usado_at: string | null
          usado_por_dispositivo_id: string | null
          vence_at: string
        }
        Insert: {
          codigo_hash: string
          creado_at?: string
          creado_por_dispositivo_id: string
          id?: string
          modo: string
          negocio_id: string
          usado_at?: string | null
          usado_por_dispositivo_id?: string | null
          vence_at: string
        }
        Update: {
          codigo_hash?: string
          creado_at?: string
          creado_por_dispositivo_id?: string
          id?: string
          modo?: string
          negocio_id?: string
          usado_at?: string | null
          usado_por_dispositivo_id?: string | null
          vence_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "codigos_emparejamiento_creado_por_dispositivo_id_fkey"
            columns: ["creado_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codigos_emparejamiento_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codigos_emparejamiento_usado_por_dispositivo_id_fkey"
            columns: ["usado_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
        ]
      }
      conflictos_sincronizacion: {
        Row: {
          creado_at: string
          detalle: Json
          entidad_id: string
          estado: string
          id: string
          negocio_id: string
          operacion_id: string
          resuelto_at: string | null
          resuelto_por_dispositivo_id: string | null
          tipo: string
          tipo_entidad: string
        }
        Insert: {
          creado_at?: string
          detalle: Json
          entidad_id: string
          estado?: string
          id?: string
          negocio_id: string
          operacion_id: string
          resuelto_at?: string | null
          resuelto_por_dispositivo_id?: string | null
          tipo: string
          tipo_entidad: string
        }
        Update: {
          creado_at?: string
          detalle?: Json
          entidad_id?: string
          estado?: string
          id?: string
          negocio_id?: string
          operacion_id?: string
          resuelto_at?: string | null
          resuelto_por_dispositivo_id?: string | null
          tipo?: string
          tipo_entidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "conflictos_sincronizacion_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflictos_sincronizacion_operacion_id_fkey"
            columns: ["operacion_id"]
            isOneToOne: false
            referencedRelation: "operaciones_sincronizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflictos_sincronizacion_resuelto_por_dispositivo_id_fkey"
            columns: ["resuelto_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
        ]
      }
      diferencias_stock: {
        Row: {
          creado_at: string
          detalle: Json
          estado: string
          id: string
          negocio_id: string
          nota_resolucion: string | null
          operacion_id: string
          origen_id: string
          origen_tipo: string
          producto_id: string
          resuelta_at: string | null
          resuelta_por_dispositivo_id: string | null
          stock_contado: number | null
          unidades_faltantes: number
        }
        Insert: {
          creado_at?: string
          detalle?: Json
          estado?: string
          id?: string
          negocio_id: string
          nota_resolucion?: string | null
          operacion_id: string
          origen_id: string
          origen_tipo: string
          producto_id: string
          resuelta_at?: string | null
          resuelta_por_dispositivo_id?: string | null
          stock_contado?: number | null
          unidades_faltantes: number
        }
        Update: {
          creado_at?: string
          detalle?: Json
          estado?: string
          id?: string
          negocio_id?: string
          nota_resolucion?: string | null
          operacion_id?: string
          origen_id?: string
          origen_tipo?: string
          producto_id?: string
          resuelta_at?: string | null
          resuelta_por_dispositivo_id?: string | null
          stock_contado?: number | null
          unidades_faltantes?: number
        }
        Relationships: [
          {
            foreignKeyName: "diferencias_stock_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diferencias_stock_negocio_id_producto_id_fkey"
            columns: ["negocio_id", "producto_id"]
            isOneToOne: false
            referencedRelation: "productos_catalogo"
            referencedColumns: ["negocio_id", "id"]
          },
          {
            foreignKeyName: "diferencias_stock_operacion_id_fkey"
            columns: ["operacion_id"]
            isOneToOne: false
            referencedRelation: "operaciones_sincronizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diferencias_stock_resuelta_por_dispositivo_id_fkey"
            columns: ["resuelta_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
        ]
      }
      dispositivos: {
        Row: {
          actualizado_at: string
          auth_user_id: string
          creado_at: string
          estado: string
          id: string
          modo: string
          negocio_id: string
          nombre: string
          tipo: string
          ultima_actividad_at: string | null
        }
        Insert: {
          actualizado_at?: string
          auth_user_id: string
          creado_at?: string
          estado?: string
          id?: string
          modo: string
          negocio_id: string
          nombre: string
          tipo: string
          ultima_actividad_at?: string | null
        }
        Update: {
          actualizado_at?: string
          auth_user_id?: string
          creado_at?: string
          estado?: string
          id?: string
          modo?: string
          negocio_id?: string
          nombre?: string
          tipo?: string
          ultima_actividad_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispositivos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_operativos: {
        Row: {
          actualizado_at: string
          actualizado_por_dispositivo_id: string
          creado_at: string
          creado_por_dispositivo_id: string
          entidad: Json
          estado: string
          fecha_jornada: string
          id: string
          negocio_id: string
          tipo: string
        }
        Insert: {
          actualizado_at?: string
          actualizado_por_dispositivo_id: string
          creado_at?: string
          creado_por_dispositivo_id: string
          entidad: Json
          estado: string
          fecha_jornada: string
          id: string
          negocio_id: string
          tipo: string
        }
        Update: {
          actualizado_at?: string
          actualizado_por_dispositivo_id?: string
          creado_at?: string
          creado_por_dispositivo_id?: string
          entidad?: Json
          estado?: string
          fecha_jornada?: string
          id?: string
          negocio_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_operativos_actualizado_por_dispositivo_id_fkey"
            columns: ["actualizado_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_operativos_creado_por_dispositivo_id_fkey"
            columns: ["creado_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_operativos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          actualizado_at: string
          catalogo_inicializado_at: string | null
          creado_at: string
          id: string
          nombre: string
        }
        Insert: {
          actualizado_at?: string
          catalogo_inicializado_at?: string | null
          creado_at?: string
          id?: string
          nombre: string
        }
        Update: {
          actualizado_at?: string
          catalogo_inicializado_at?: string | null
          creado_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      operaciones_sincronizacion: {
        Row: {
          aplicada_at: string | null
          codigo_error: string | null
          creada_cliente_at: string
          detalle_error: string | null
          dispositivo_id: string
          entidad_id: string
          estado: string
          id: string
          negocio_id: string
          payload: Json
          recibida_at: string
          resultado: Json | null
          secuencia: number
          tipo_entidad: string
          tipo_operacion: string
        }
        Insert: {
          aplicada_at?: string | null
          codigo_error?: string | null
          creada_cliente_at: string
          detalle_error?: string | null
          dispositivo_id: string
          entidad_id: string
          estado?: string
          id: string
          negocio_id: string
          payload: Json
          recibida_at?: string
          resultado?: Json | null
          secuencia?: never
          tipo_entidad: string
          tipo_operacion: string
        }
        Update: {
          aplicada_at?: string | null
          codigo_error?: string | null
          creada_cliente_at?: string
          detalle_error?: string | null
          dispositivo_id?: string
          entidad_id?: string
          estado?: string
          id?: string
          negocio_id?: string
          payload?: Json
          recibida_at?: string
          resultado?: Json | null
          secuencia?: never
          tipo_entidad?: string
          tipo_operacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "operaciones_sincronizacion_dispositivo_id_fkey"
            columns: ["dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operaciones_sincronizacion_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_catalogo: {
        Row: {
          actualizado_cliente_at: string
          actualizado_por_dispositivo_id: string
          categoria_id: string
          costo_compra: number
          creado_cliente_at: string
          eliminado_at: string | null
          eliminado_cliente_at: string | null
          estado: string
          id: string
          marca: string | null
          modo_compra_habitual: string
          negocio_id: string
          nombre: string
          nombre_pack: string | null
          observaciones: string | null
          precio_venta: number
          presentacion: string | null
          stock_actual: number
          stock_objetivo: number
          unidades_por_pack: number | null
          version: number
        }
        Insert: {
          actualizado_cliente_at: string
          actualizado_por_dispositivo_id: string
          categoria_id: string
          costo_compra: number
          creado_cliente_at: string
          eliminado_at?: string | null
          eliminado_cliente_at?: string | null
          estado: string
          id: string
          marca?: string | null
          modo_compra_habitual?: string
          negocio_id: string
          nombre: string
          nombre_pack?: string | null
          observaciones?: string | null
          precio_venta: number
          presentacion?: string | null
          stock_actual: number
          stock_objetivo: number
          unidades_por_pack?: number | null
          version?: number
        }
        Update: {
          actualizado_cliente_at?: string
          actualizado_por_dispositivo_id?: string
          categoria_id?: string
          costo_compra?: number
          creado_cliente_at?: string
          eliminado_at?: string | null
          eliminado_cliente_at?: string | null
          estado?: string
          id?: string
          marca?: string | null
          modo_compra_habitual?: string
          negocio_id?: string
          nombre?: string
          nombre_pack?: string | null
          observaciones?: string | null
          precio_venta?: number
          presentacion?: string | null
          stock_actual?: number
          stock_objetivo?: number
          unidades_por_pack?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "productos_catalogo_actualizado_por_dispositivo_id_fkey"
            columns: ["actualizado_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_catalogo_negocio_id_categoria_id_fkey"
            columns: ["negocio_id", "categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_catalogo"
            referencedColumns: ["negocio_id", "id"]
          },
          {
            foreignKeyName: "productos_catalogo_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      recuperacion_negocio: {
        Row: {
          codigo_hash: string
          negocio_id: string
          rotado_at: string
        }
        Insert: {
          codigo_hash: string
          negocio_id: string
          rotado_at?: string
        }
        Update: {
          codigo_hash?: string
          negocio_id?: string
          rotado_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recuperacion_negocio_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: true
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas_operativas: {
        Row: {
          actualizado_at: string
          actualizado_por_dispositivo_id: string
          condicion_pago: string
          creado_at: string
          creado_por_dispositivo_id: string
          entidad: Json
          estado: string
          fecha_jornada: string
          id: string
          negocio_id: string
          total: number
        }
        Insert: {
          actualizado_at?: string
          actualizado_por_dispositivo_id: string
          condicion_pago: string
          creado_at?: string
          creado_por_dispositivo_id: string
          entidad: Json
          estado: string
          fecha_jornada: string
          id: string
          negocio_id: string
          total: number
        }
        Update: {
          actualizado_at?: string
          actualizado_por_dispositivo_id?: string
          condicion_pago?: string
          creado_at?: string
          creado_por_dispositivo_id?: string
          entidad?: Json
          estado?: string
          fecha_jornada?: string
          id?: string
          negocio_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ventas_operativas_actualizado_por_dispositivo_id_fkey"
            columns: ["actualizado_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_operativas_creado_por_dispositivo_id_fkey"
            columns: ["creado_por_dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_operativas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activar_negocio_inicial: {
        Args: {
          p_codigo_activacion: string
          p_nombre_dispositivo: string
          p_nombre_negocio: string
        }
        Returns: Json
      }
      actualizar_nombre_dispositivo_actual: {
        Args: { p_nombre: string }
        Returns: Json
      }
      aplicar_operaciones_catalogo: {
        Args: { p_operaciones: Json }
        Returns: Json
      }
      aplicar_operaciones_operativas: {
        Args: { p_operaciones: Json }
        Returns: Json
      }
      aplicar_operaciones_tesoreria: {
        Args: { p_operaciones: Json }
        Returns: Json
      }
      emparejar_dispositivo: {
        Args: { p_codigo: string; p_nombre_dispositivo: string }
        Returns: Json
      }
      desvincular_dispositivo_actual: { Args: never; Returns: Json }
      generar_codigo_emparejamiento: {
        Args: { p_modo?: string }
        Returns: Json
      }
      inicializar_catalogo: {
        Args: { p_categorias: Json; p_operacion_id: string; p_productos: Json }
        Returns: Json
      }
      listar_diferencias_stock: { Args: never; Returns: Json }
      obtener_cambios_catalogo: {
        Args: { p_cursor?: number; p_limite?: number }
        Returns: Json
      }
      obtener_snapshot_catalogo: { Args: never; Returns: Json }
      obtener_snapshot_tesoreria: { Args: never; Returns: Json }
      recuperar_dispositivo_principal: {
        Args: { p_codigo_recuperacion: string; p_nombre_dispositivo: string }
        Returns: Json
      }
      resolver_conflicto_catalogo: {
        Args: { p_conflicto_id: string; p_resolucion: string }
        Returns: Json
      }
      resolver_conflicto_operativo: {
        Args: { p_conflicto_id: string }
        Returns: Json
      }
      resolver_diferencia_stock: {
        Args: {
          p_diferencia_id: string
          p_nota?: string
          p_stock_contado: number
        }
        Returns: Json
      }
      revocar_dispositivo: { Args: { p_dispositivo_id: string }; Returns: Json }
      transferir_dispositivo_principal: {
        Args: { p_dispositivo_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
