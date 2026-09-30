export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: { Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string;
          id: number;
          image_path: string | null;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: never;
          image_path?: string | null;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: never;
          image_path?: string | null;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      delivery_areas: {
        Row: {
          active: boolean;
          created_at: string;
          fee_kes: number;
          id: number;
          is_pickup: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          fee_kes?: number;
          id?: never;
          is_pickup?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          fee_kes?: number;
          id?: never;
          is_pickup?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          answer: string;
          created_at: string;
          id: number;
          question: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          answer: string;
          created_at?: string;
          id?: never;
          question: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          created_at?: string;
          id?: never;
          question?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          line_no: number;
          line_total_kes: number;
          name: string;
          order_id: string;
          product_id: number | null;
          qty: number;
          rx_class: Database["public"]["Enums"]["rx_class"];
          sku: string;
          unit_price_kes: number;
        };
        Insert: {
          line_no: number;
          line_total_kes: number;
          name: string;
          order_id: string;
          product_id?: number | null;
          qty: number;
          rx_class: Database["public"]["Enums"]["rx_class"];
          sku: string;
          unit_price_kes: number;
        };
        Update: {
          line_no?: number;
          line_total_kes?: number;
          name?: string;
          order_id?: string;
          product_id?: number | null;
          qty?: number;
          rx_class?: Database["public"]["Enums"]["rx_class"];
          sku?: string;
          unit_price_kes?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: string | null;
          created_at: string;
          customer_name: string;
          delivery_area: string;
          delivery_area_id: number | null;
          delivery_fee_kes: number;
          email: string | null;
          fulfilment: Database["public"]["Enums"]["fulfilment"];
          id: string;
          items_total_kes: number;
          notes: string | null;
          number: number;
          phone: string;
          public_token: string;
          status: Database["public"]["Enums"]["order_status"];
          total_kes: number;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          customer_name: string;
          delivery_area: string;
          delivery_area_id?: number | null;
          delivery_fee_kes: number;
          email?: string | null;
          fulfilment: Database["public"]["Enums"]["fulfilment"];
          id?: string;
          items_total_kes: number;
          notes?: string | null;
          number?: never;
          phone: string;
          public_token?: string;
          status?: Database["public"]["Enums"]["order_status"];
          total_kes: number;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          customer_name?: string;
          delivery_area?: string;
          delivery_area_id?: number | null;
          delivery_fee_kes?: number;
          email?: string | null;
          fulfilment?: Database["public"]["Enums"]["fulfilment"];
          id?: string;
          items_total_kes?: number;
          notes?: string | null;
          number?: never;
          phone?: string;
          public_token?: string;
          status?: Database["public"]["Enums"]["order_status"];
          total_kes?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_delivery_area_id_fkey";
            columns: ["delivery_area_id"];
            isOneToOne: false;
            referencedRelation: "delivery_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: number;
          created_at: string;
          description: string;
          featured: boolean;
          id: number;
          image_path: string | null;
          in_stock: boolean;
          name: string;
          price_kes: number;
          published: boolean;
          rx_class: Database["public"]["Enums"]["rx_class"];
          search: unknown;
          short_description: string;
          sku: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          category_id: number;
          created_at?: string;
          description?: string;
          featured?: boolean;
          id?: never;
          image_path?: string | null;
          in_stock?: boolean;
          name: string;
          price_kes: number;
          published?: boolean;
          rx_class?: Database["public"]["Enums"]["rx_class"];
          search?: never;
          short_description?: string;
          sku: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          category_id?: number;
          created_at?: string;
          description?: string;
          featured?: boolean;
          id?: never;
          image_path?: string | null;
          in_stock?: boolean;
          name?: string;
          price_kes?: number;
          published?: boolean;
          rx_class?: Database["public"]["Enums"]["rx_class"];
          search?: never;
          short_description?: string;
          sku?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["staff_role"];
        };
        Insert: {
          created_at?: string;
          full_name?: string;
          id: string;
          role?: Database["public"]["Enums"]["staff_role"];
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["staff_role"];
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: NonNullable<Json>;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      normalise_msisdn: { Args: { p_number: string }; Returns: string };
      order_by_token: { Args: { p_token: string }; Returns: Json };
      place_order: {
        Args: {
          p_address: string;
          p_customer_name: string;
          p_delivery_area_id: number;
          p_email: string;
          p_items: Json;
          p_notes: string;
          p_phone: string;
        };
        Returns: {
          order_id: string;
          order_number: number;
          public_token: string;
        }[];
      };
      search_products: {
        Args: { p_limit?: number; p_query: string };
        Returns: {
          category_id: number;
          created_at: string;
          description: string;
          featured: boolean;
          id: number;
          image_path: string | null;
          in_stock: boolean;
          name: string;
          price_kes: number;
          published: boolean;
          rx_class: Database["public"]["Enums"]["rx_class"];
          search: unknown;
          short_description: string;
          sku: string;
          slug: string;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "products";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      fulfilment: "delivery" | "pickup";
      order_status: "new" | "confirmed" | "completed" | "cancelled";
      rx_class: "general" | "pharmacy_only" | "prescription_only";
      staff_role: "owner" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      fulfilment: ["delivery", "pickup"],
      order_status: ["new", "confirmed", "completed", "cancelled"],
      rx_class: ["general", "pharmacy_only", "prescription_only"],
      staff_role: ["owner", "staff"],
    },
  },
} as const;
