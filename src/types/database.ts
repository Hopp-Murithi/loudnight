export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      agent_runs: {
        Row: {
          context: Json
          created_at: string
          current_step: Database["public"]["Enums"]["pipeline_step"] | null
          error_message: string | null
          finished_at: string | null
          generic_answer: string | null
          id: string
          mode: Database["public"]["Enums"]["run_mode"]
          pair_id: string | null
          requested_by: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["run_status"]
          target_weekday: Database["public"]["Enums"]["weekday"]
          venue_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          current_step?: Database["public"]["Enums"]["pipeline_step"] | null
          error_message?: string | null
          finished_at?: string | null
          generic_answer?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["run_mode"]
          pair_id?: string | null
          requested_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          target_weekday: Database["public"]["Enums"]["weekday"]
          venue_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          current_step?: Database["public"]["Enums"]["pipeline_step"] | null
          error_message?: string | null
          finished_at?: string | null
          generic_answer?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["run_mode"]
          pair_id?: string | null
          requested_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          target_weekday?: Database["public"]["Enums"]["weekday"]
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_pair_fkey"
            columns: ["pair_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "agent_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          metadata: Json
          subject_id: string | null
          subject_type: string
          venue_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          subject_id?: string | null
          subject_type: string
          venue_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          subject_id?: string | null
          subject_type?: string
          venue_id?: string | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          client_key: string | null
          created_at: string
          event_night_id: string
          id: string
          party_size: number
          rsvp_id: string | null
          spend_cents: number | null
          venue_id: string
        }
        Insert: {
          client_key?: string | null
          created_at?: string
          event_night_id: string
          id?: string
          party_size?: number
          rsvp_id?: string | null
          spend_cents?: number | null
          venue_id: string
        }
        Update: {
          client_key?: string | null
          created_at?: string
          event_night_id?: string
          id?: string
          party_size?: number
          rsvp_id?: string | null
          spend_cents?: number | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_event_night_id_venue_id_fkey"
            columns: ["event_night_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "event_nights"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "checkins_rsvp_id_event_night_id_fkey"
            columns: ["rsvp_id", "event_night_id"]
            isOneToOne: false
            referencedRelation: "rsvps"
            referencedColumns: ["id", "event_night_id"]
          },
        ]
      }
      concepts: {
        Row: {
          audience_fit: number
          chosen_at: string | null
          cost_fit: number
          created_at: string
          estimated_cost_cents: number
          expected_audience: number | null
          format: Database["public"]["Enums"]["concept_format"]
          id: string
          is_shortlisted: boolean
          name: string
          needs: Database["public"]["Enums"]["venue_capability"][]
          novelty: number
          pitch: string
          rank: number
          reason_beats_nearby: string
          run_id: string
          themes: string[]
          total_score: number | null
          venue_fit: number
          venue_id: string
        }
        Insert: {
          audience_fit: number
          chosen_at?: string | null
          cost_fit: number
          created_at?: string
          estimated_cost_cents?: number
          expected_audience?: number | null
          format?: Database["public"]["Enums"]["concept_format"]
          id?: string
          is_shortlisted?: boolean
          name: string
          needs?: Database["public"]["Enums"]["venue_capability"][]
          novelty: number
          pitch: string
          rank: number
          reason_beats_nearby: string
          run_id: string
          themes?: string[]
          total_score?: number | null
          venue_fit: number
          venue_id: string
        }
        Update: {
          audience_fit?: number
          chosen_at?: string | null
          cost_fit?: number
          created_at?: string
          estimated_cost_cents?: number
          expected_audience?: number | null
          format?: Database["public"]["Enums"]["concept_format"]
          id?: string
          is_shortlisted?: boolean
          name?: string
          needs?: Database["public"]["Enums"]["venue_capability"][]
          novelty?: number
          pitch?: string
          rank?: number
          reason_beats_nearby?: string
          run_id?: string
          themes?: string[]
          total_score?: number | null
          venue_fit?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concepts_run_id_venue_id_fkey"
            columns: ["run_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id", "venue_id"]
          },
        ]
      }
      event_nights: {
        Row: {
          assets: Json
          blurb: string | null
          created_at: string
          decided_at: string | null
          decision: Database["public"]["Enums"]["night_decision"] | null
          id: string
          lineup: string[]
          public_slug: string
          published_at: string | null
          sequence: number
          series_id: string
          starts_at: string
          status: Database["public"]["Enums"]["night_status"]
          title: string | null
          updated_at: string
          variation: string
          venue_id: string
        }
        Insert: {
          assets?: Json
          blurb?: string | null
          created_at?: string
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["night_decision"] | null
          id?: string
          lineup?: string[]
          public_slug: string
          published_at?: string | null
          sequence: number
          series_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["night_status"]
          title?: string | null
          updated_at?: string
          variation: string
          venue_id: string
        }
        Update: {
          assets?: Json
          blurb?: string | null
          created_at?: string
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["night_decision"] | null
          id?: string
          lineup?: string[]
          public_slug?: string
          published_at?: string | null
          sequence?: number
          series_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["night_status"]
          title?: string | null
          updated_at?: string
          variation?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_nights_series_id_venue_id_fkey"
            columns: ["series_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id", "venue_id"]
          },
        ]
      }
      evidence: {
        Row: {
          claim: string
          concept_id: string
          created_at: string
          id: string
          qloo_cache_id: string
          response_path: string[]
          value: number
          venue_id: string
        }
        Insert: {
          claim: string
          concept_id: string
          created_at?: string
          id?: string
          qloo_cache_id: string
          response_path: string[]
          value: number
          venue_id: string
        }
        Update: {
          claim?: string
          concept_id?: string
          created_at?: string
          id?: string
          qloo_cache_id?: string
          response_path?: string[]
          value?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_concept_id_venue_id_fkey"
            columns: ["concept_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "evidence_qloo_cache_id_fkey"
            columns: ["qloo_cache_id"]
            isOneToOne: false
            referencedRelation: "qloo_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      night_spend: {
        Row: {
          event_night_id: string
          noted_by: string | null
          spend_cents: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          event_night_id: string
          noted_by?: string | null
          spend_cents: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          event_night_id?: string
          noted_by?: string | null
          spend_cents?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "night_spend_event_night_id_venue_id_fkey"
            columns: ["event_night_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "event_nights"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "night_spend_noted_by_fkey"
            columns: ["noted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      open_data_cache: {
        Row: {
          expires_at: string
          fetched_at: string
          id: string
          request: Json
          request_hash: string
          response: Json
          source: string
        }
        Insert: {
          expires_at: string
          fetched_at?: string
          id?: string
          request: Json
          request_hash: string
          response: Json
          source: string
        }
        Update: {
          expires_at?: string
          fetched_at?: string
          id?: string
          request?: Json
          request_hash?: string
          response?: Json
          source?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean
          is_anonymous: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_active?: boolean
          is_anonymous?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_anonymous?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      qloo_cache: {
        Row: {
          endpoint: string
          expires_at: string
          fetched_at: string
          id: string
          request: Json
          request_hash: string
          response: Json
          superseded_at: string | null
        }
        Insert: {
          endpoint: string
          expires_at: string
          fetched_at?: string
          id?: string
          request: Json
          request_hash: string
          response: Json
          superseded_at?: string | null
        }
        Update: {
          endpoint?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          request?: Json
          request_hash?: string
          response?: Json
          superseded_at?: string | null
        }
        Relationships: []
      }
      rsvp_contacts: {
        Row: {
          contact: string
          created_at: string
          event_night_id: string
          rsvp_id: string
          venue_id: string
        }
        Insert: {
          contact: string
          created_at?: string
          event_night_id: string
          rsvp_id: string
          venue_id: string
        }
        Update: {
          contact?: string
          created_at?: string
          event_night_id?: string
          rsvp_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_contacts_event_night_id_venue_id_fkey"
            columns: ["event_night_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "event_nights"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "rsvp_contacts_rsvp_id_event_night_id_fkey"
            columns: ["rsvp_id", "event_night_id"]
            isOneToOne: false
            referencedRelation: "rsvps"
            referencedColumns: ["id", "event_night_id"]
          },
        ]
      }
      rsvps: {
        Row: {
          checkin_code: string
          created_at: string
          event_night_id: string
          guest_name: string
          id: string
          party_size: number
          venue_id: string
        }
        Insert: {
          checkin_code?: string
          created_at?: string
          event_night_id: string
          guest_name: string
          id?: string
          party_size?: number
          venue_id: string
        }
        Update: {
          checkin_code?: string
          created_at?: string
          event_night_id?: string
          guest_name?: string
          id?: string
          party_size?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_night_id_venue_id_fkey"
            columns: ["event_night_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "event_nights"
            referencedColumns: ["id", "venue_id"]
          },
        ]
      }
      run_steps: {
        Row: {
          finished_at: string | null
          id: string
          input: Json
          latency_ms: number | null
          output_summary: Json
          qloo_cache_id: string | null
          run_id: string
          started_at: string
          status: Database["public"]["Enums"]["step_status"]
          step: Database["public"]["Enums"]["pipeline_step"]
          tool: string
          venue_id: string
        }
        Insert: {
          finished_at?: string | null
          id?: string
          input?: Json
          latency_ms?: number | null
          output_summary?: Json
          qloo_cache_id?: string | null
          run_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["step_status"]
          step: Database["public"]["Enums"]["pipeline_step"]
          tool: string
          venue_id: string
        }
        Update: {
          finished_at?: string | null
          id?: string
          input?: Json
          latency_ms?: number | null
          output_summary?: Json
          qloo_cache_id?: string | null
          run_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["step_status"]
          step?: Database["public"]["Enums"]["pipeline_step"]
          tool?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_steps_qloo_cache_id_fkey"
            columns: ["qloo_cache_id"]
            isOneToOne: false
            referencedRelation: "qloo_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_steps_run_id_venue_id_fkey"
            columns: ["run_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id", "venue_id"]
          },
        ]
      }
      series: {
        Row: {
          concept_id: string
          created_at: string
          id: string
          starts_on: string
          status: Database["public"]["Enums"]["series_status"]
          updated_at: string
          venue_id: string
          weekday: Database["public"]["Enums"]["weekday"]
        }
        Insert: {
          concept_id: string
          created_at?: string
          id?: string
          starts_on: string
          status?: Database["public"]["Enums"]["series_status"]
          updated_at?: string
          venue_id: string
          weekday: Database["public"]["Enums"]["weekday"]
        }
        Update: {
          concept_id?: string
          created_at?: string
          id?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["series_status"]
          updated_at?: string
          venue_id?: string
          weekday?: Database["public"]["Enums"]["weekday"]
        }
        Relationships: [
          {
            foreignKeyName: "series_concept_id_venue_id_fkey"
            columns: ["concept_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id", "venue_id"]
          },
        ]
      }
      talent_candidates: {
        Row: {
          booked_at: string | null
          concept_id: string
          created_at: string
          fit_signals: string[]
          id: string
          name: string
          outreach_draft: string | null
          outreach_edited: string | null
          overlap_score: number
          popularity_tier: Database["public"]["Enums"]["popularity_tier"]
          profile: Json
          qloo_cache_id: string | null
          qloo_entity_id: string
          response_path: string[]
          search_page: number
          source: string
          venue_id: string
        }
        Insert: {
          booked_at?: string | null
          concept_id: string
          created_at?: string
          fit_signals?: string[]
          id?: string
          name: string
          outreach_draft?: string | null
          outreach_edited?: string | null
          overlap_score: number
          popularity_tier: Database["public"]["Enums"]["popularity_tier"]
          profile?: Json
          qloo_cache_id?: string | null
          qloo_entity_id: string
          response_path?: string[]
          search_page?: number
          source?: string
          venue_id: string
        }
        Update: {
          booked_at?: string | null
          concept_id?: string
          created_at?: string
          fit_signals?: string[]
          id?: string
          name?: string
          outreach_draft?: string | null
          outreach_edited?: string | null
          overlap_score?: number
          popularity_tier?: Database["public"]["Enums"]["popularity_tier"]
          profile?: Json
          qloo_cache_id?: string | null
          qloo_entity_id?: string
          response_path?: string[]
          search_page?: number
          source?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_candidates_concept_id_venue_id_fkey"
            columns: ["concept_id", "venue_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id", "venue_id"]
          },
          {
            foreignKeyName: "talent_candidates_qloo_cache_id_fkey"
            columns: ["qloo_cache_id"]
            isOneToOne: false
            referencedRelation: "qloo_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_members: {
        Row: {
          added_by: string | null
          created_at: string
          role: Database["public"]["Enums"]["venue_role"]
          user_id: string
          venue_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          role: Database["public"]["Enums"]["venue_role"]
          user_id: string
          venue_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          role?: Database["public"]["Enums"]["venue_role"]
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_members_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_settings: {
        Row: {
          atmosphere: string
          average_spend_cents: number
          break_even_headcount: number
          capabilities: Database["public"]["Enums"]["venue_capability"][]
          capacity: number
          created_at: string
          hosts: Database["public"]["Enums"]["venue_host"][]
          quiet_nights: Database["public"]["Enums"]["weekday"][]
          search_radius_m: number
          slow_night: Database["public"]["Enums"]["weekday"]
          talent_budget_cents: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          atmosphere?: string
          average_spend_cents?: number
          break_even_headcount: number
          capabilities?: Database["public"]["Enums"]["venue_capability"][]
          capacity: number
          created_at?: string
          hosts?: Database["public"]["Enums"]["venue_host"][]
          quiet_nights?: Database["public"]["Enums"]["weekday"][]
          search_radius_m?: number
          slow_night: Database["public"]["Enums"]["weekday"]
          talent_budget_cents?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          atmosphere?: string
          average_spend_cents?: number
          break_even_headcount?: number
          capabilities?: Database["public"]["Enums"]["venue_capability"][]
          capacity?: number
          created_at?: string
          hosts?: Database["public"]["Enums"]["venue_host"][]
          quiet_nights?: Database["public"]["Enums"]["weekday"][]
          search_radius_m?: number
          slow_night?: Database["public"]["Enums"]["weekday"]
          talent_budget_cents?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          city: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          currency: string
          google_place_id: string | null
          id: string
          is_demo: boolean
          latitude: number
          longitude: number
          name: string
          suspended_at: string | null
          suspended_by: string | null
          suspended_reason: string | null
          time_zone: string
          updated_at: string
          venue_type: Database["public"]["Enums"]["venue_type"]
        }
        Insert: {
          address: string
          city?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          google_place_id?: string | null
          id?: string
          is_demo?: boolean
          latitude: number
          longitude: number
          name: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          time_zone?: string
          updated_at?: string
          venue_type?: Database["public"]["Enums"]["venue_type"]
        }
        Update: {
          address?: string
          city?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          google_place_id?: string | null
          id?: string
          is_demo?: boolean
          latitude?: number
          longitude?: number
          name?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          time_zone?: string
          updated_at?: string
          venue_type?: Database["public"]["Enums"]["venue_type"]
        }
        Relationships: [
          {
            foreignKeyName: "venues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      choose_concept: { Args: { p_concept_id: string }; Returns: string }
      consume_rate_limit: {
        Args: { bucket: string; max_hits: number; window_seconds: number }
        Returns: boolean
      }
      create_series: {
        Args: { p_concept_id: string; p_nights: Json; p_starts_on: string }
        Returns: string
      }
      create_venue: {
        Args: {
          p_address: string
          p_atmosphere?: string
          p_average_spend_cents: number
          p_break_even_headcount: number
          p_capabilities: Database["public"]["Enums"]["venue_capability"][]
          p_capacity: number
          p_city?: string
          p_country_code?: string
          p_currency?: string
          p_google_place_id: string
          p_hosts?: Database["public"]["Enums"]["venue_host"][]
          p_latitude: number
          p_longitude: number
          p_name: string
          p_quiet_nights?: Database["public"]["Enums"]["weekday"][]
          p_slow_night: Database["public"]["Enums"]["weekday"]
          p_talent_budget_cents: number
          p_time_zone: string
          p_venue_type: Database["public"]["Enums"]["venue_type"]
        }
        Returns: string
      }
      reserve_place: {
        Args: {
          p_checkin_code: string
          p_contact: string
          p_guest_name: string
          p_night_id: string
          p_party_size: number
        }
        Returns: undefined
      }
      store_qloo_answer: {
        Args: {
          p_endpoint: string
          p_request: Json
          p_request_hash: string
          p_response: Json
          p_ttl_days: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "administrator"
      concept_format:
        | "live_music"
        | "dj_night"
        | "screening"
        | "food_and_drink"
        | "talk"
        | "game"
        | "workshop"
        | "other"
      night_decision: "keep" | "tweak" | "swap"
      night_status: "draft" | "published" | "cancelled"
      pipeline_step:
        | "scout"
        | "read_neighbourhood"
        | "find_gap"
        | "generate_concepts"
        | "score"
        | "plan"
      popularity_tier: "emerging" | "local" | "regional" | "national"
      run_mode: "encore" | "generic"
      run_status: "queued" | "running" | "succeeded" | "failed"
      series_status: "draft" | "launched" | "ended"
      step_status: "running" | "succeeded" | "failed"
      venue_capability:
        | "stage"
        | "screen"
        | "sound_system"
        | "kitchen"
        | "outdoor_space"
        | "dance_floor"
      venue_host:
        | "live_music"
        | "dj_dancing"
        | "poetry"
        | "comedy"
        | "seated_sets"
        | "quiz_games"
        | "talks"
        | "film"
      venue_role: "owner" | "manager" | "door"
      venue_type: "bar" | "cafe" | "restaurant" | "music_venue" | "other"
      weekday:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["owner", "administrator"],
      concept_format: [
        "live_music",
        "dj_night",
        "screening",
        "food_and_drink",
        "talk",
        "game",
        "workshop",
        "other",
      ],
      night_decision: ["keep", "tweak", "swap"],
      night_status: ["draft", "published", "cancelled"],
      pipeline_step: [
        "scout",
        "read_neighbourhood",
        "find_gap",
        "generate_concepts",
        "score",
        "plan",
      ],
      popularity_tier: ["emerging", "local", "regional", "national"],
      run_mode: ["encore", "generic"],
      run_status: ["queued", "running", "succeeded", "failed"],
      series_status: ["draft", "launched", "ended"],
      step_status: ["running", "succeeded", "failed"],
      venue_capability: [
        "stage",
        "screen",
        "sound_system",
        "kitchen",
        "outdoor_space",
        "dance_floor",
      ],
      venue_host: [
        "live_music",
        "dj_dancing",
        "poetry",
        "comedy",
        "seated_sets",
        "quiz_games",
        "talks",
        "film",
      ],
      venue_role: ["owner", "manager", "door"],
      venue_type: ["bar", "cafe", "restaurant", "music_venue", "other"],
      weekday: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
  },
} as const

