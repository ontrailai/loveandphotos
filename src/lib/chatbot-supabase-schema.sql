-- Love & Photos Chatbot Database Schema
-- This creates the necessary tables to store chat conversations and analytics

-- Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Optional, can be null for anonymous
  session_id TEXT NOT NULL, -- Browser session identifier
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'unanswered', 'escalated')),
  last_message TEXT,
  message_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  satisfaction TEXT CHECK (satisfaction IN ('positive', 'neutral', 'negative')),
  flagged BOOLEAN DEFAULT FALSE,
  response_time INTEGER, -- Average response time in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'bot', 'system')),
  content TEXT NOT NULL,
  intent TEXT, -- Detected intent (PACKAGE_QUESTION, VIDEO_QUESTION, etc.)
  confidence DECIMAL(3,2), -- Confidence score for bot responses
  needs_response BOOLEAN DEFAULT FALSE, -- Flag for unanswered questions
  metadata JSONB, -- Store additional data like suggested actions, chips, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Analytics Table
CREATE TABLE IF NOT EXISTS chat_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  total_conversations INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_messages_per_conversation DECIMAL(5,2),
  avg_response_time DECIMAL(5,2), -- in seconds
  satisfaction_positive INTEGER DEFAULT 0,
  satisfaction_neutral INTEGER DEFAULT 0,
  satisfaction_negative INTEGER DEFAULT 0,
  unanswered_count INTEGER DEFAULT 0,
  escalated_count INTEGER DEFAULT 0,
  top_intents JSONB, -- Array of most common intents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Common Questions Cache Table (for faster responses)
CREATE TABLE IF NOT EXISTS chat_faq_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_pattern TEXT NOT NULL,
  intent TEXT NOT NULL,
  response TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_session_id ON chat_conversations(session_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX idx_chat_conversations_created_at ON chat_conversations(created_at DESC);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_needs_response ON chat_messages(needs_response) WHERE needs_response = TRUE;
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

CREATE INDEX idx_chat_analytics_date ON chat_analytics(date DESC);
CREATE INDEX idx_chat_faq_cache_intent ON chat_faq_cache(intent);

-- Row Level Security (RLS) Policies
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_faq_cache ENABLE ROW LEVEL SECURITY;

-- Public can insert conversations and messages (for anonymous chat)
CREATE POLICY "Public can create conversations" ON chat_conversations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can create messages" ON chat_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Admins can view all data
CREATE POLICY "Admins can view all conversations" ON chat_conversations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all messages" ON chat_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage analytics" ON chat_analytics
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Public can read FAQ cache
CREATE POLICY "Public can read FAQ cache" ON chat_faq_cache
  FOR SELECT TO anon, authenticated
  USING (true);

-- Function to update conversation stats
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_conversations
    SET 
      message_count = message_count + 1,
      last_message = NEW.content,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_stats();

-- Function to calculate daily analytics
CREATE OR REPLACE FUNCTION calculate_daily_chat_analytics()
RETURNS void AS $$
DECLARE
  v_date DATE := CURRENT_DATE - INTERVAL '1 day';
  v_total_conversations INTEGER;
  v_unique_users INTEGER;
  v_avg_messages DECIMAL(5,2);
  v_avg_response DECIMAL(5,2);
  v_positive INTEGER;
  v_neutral INTEGER;
  v_negative INTEGER;
  v_unanswered INTEGER;
  v_escalated INTEGER;
  v_top_intents JSONB;
BEGIN
  -- Calculate metrics
  SELECT 
    COUNT(DISTINCT id),
    COUNT(DISTINCT user_id),
    AVG(message_count),
    AVG(response_time)
  INTO v_total_conversations, v_unique_users, v_avg_messages, v_avg_response
  FROM chat_conversations
  WHERE DATE(created_at) = v_date;
  
  -- Calculate satisfaction
  SELECT 
    COUNT(*) FILTER (WHERE satisfaction = 'positive'),
    COUNT(*) FILTER (WHERE satisfaction = 'neutral'),
    COUNT(*) FILTER (WHERE satisfaction = 'negative'),
    COUNT(*) FILTER (WHERE status = 'unanswered'),
    COUNT(*) FILTER (WHERE status = 'escalated')
  INTO v_positive, v_neutral, v_negative, v_unanswered, v_escalated
  FROM chat_conversations
  WHERE DATE(created_at) = v_date;
  
  -- Get top intents
  SELECT jsonb_agg(intent_count)
  INTO v_top_intents
  FROM (
    SELECT jsonb_build_object(
      'intent', intent,
      'count', COUNT(*)
    ) as intent_count
    FROM chat_messages
    WHERE DATE(created_at) = v_date
      AND intent IS NOT NULL
    GROUP BY intent
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) t;
  
  -- Insert or update analytics
  INSERT INTO chat_analytics (
    date,
    total_conversations,
    unique_users,
    avg_messages_per_conversation,
    avg_response_time,
    satisfaction_positive,
    satisfaction_neutral,
    satisfaction_negative,
    unanswered_count,
    escalated_count,
    top_intents
  ) VALUES (
    v_date,
    COALESCE(v_total_conversations, 0),
    COALESCE(v_unique_users, 0),
    COALESCE(v_avg_messages, 0),
    COALESCE(v_avg_response, 0),
    COALESCE(v_positive, 0),
    COALESCE(v_neutral, 0),
    COALESCE(v_negative, 0),
    COALESCE(v_unanswered, 0),
    COALESCE(v_escalated, 0),
    v_top_intents
  )
  ON CONFLICT (date) DO UPDATE SET
    total_conversations = EXCLUDED.total_conversations,
    unique_users = EXCLUDED.unique_users,
    avg_messages_per_conversation = EXCLUDED.avg_messages_per_conversation,
    avg_response_time = EXCLUDED.avg_response_time,
    satisfaction_positive = EXCLUDED.satisfaction_positive,
    satisfaction_neutral = EXCLUDED.satisfaction_neutral,
    satisfaction_negative = EXCLUDED.satisfaction_negative,
    unanswered_count = EXCLUDED.unanswered_count,
    escalated_count = EXCLUDED.escalated_count,
    top_intents = EXCLUDED.top_intents;
END;
$$ LANGUAGE plpgsql;

-- Sample FAQ entries
INSERT INTO chat_faq_cache (question_pattern, intent, response) VALUES
('package', 'PACKAGE_QUESTION', 'We offer three packages: Starter ($149, 1hr), Pro ($349, 3hrs), and Luxe ($749, 6+hrs). Which would you like to learn more about?'),
('video', 'VIDEO_QUESTION', 'We offer video add-ons including Highlight Reels (+$500), Full Ceremony (+$750), and Documentary Edits (+$1500). Would you like to see videographers?'),
('book', 'BOOKING_QUESTION', 'Booking is simple! Browse photographers, check availability, and secure your date with a deposit. Most photographers respond within 2 hours.'),
('cancel', 'CANCELLATION_QUESTION', 'Each photographer sets their own cancellation policy, typically allowing free cancellation up to 30 days before your event.'),
('trust', 'TRUST_QUESTION', 'All photographers are vetted, insured, and backed by our satisfaction guarantee. We have over 10,000 happy couples!')
ON CONFLICT DO NOTHING;