"""
Angel AI Views - LangChain Integration with OpenRouter

Provides AI chat functionality for the Angel AI feature using OpenRouter API.
Includes streaming responses and RAG-based context from legal resources.
OPTIMIZED: Uses Pinecone vector database for semantic search.
"""

import os
import json
import logging
import time
import re
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import StreamingHttpResponse
from django.conf import settings
from django.core.cache import cache

from .chat_models import ChatConversation, ChatMessage

logger = logging.getLogger(__name__)

# Cache keys and TTL
SYSTEM_PROMPT_CACHE_KEY = 'angel_ai_system_prompt'
CACHE_TTL = 3600  # 1 hour


def clean_markdown_formatting(text: str) -> str:
    """Remove unwanted markdown formatting from AI responses."""
    if not text:
        return text
    
    # Remove **bold** formatting -> just the text inside (handle multiline)
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text, flags=re.DOTALL)
    
    # Remove __bold__ formatting -> just the text inside  
    text = re.sub(r'__(.+?)__', r'\1', text, flags=re.DOTALL)
    
    # Remove *italic* formatting -> just the text inside
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'\1', text)
    
    # Remove ## headers -> just the text (keep on same line)
    text = re.sub(r'^#{1,6}\s+(.+)$', r'\1', text, flags=re.MULTILINE)
    
    return text

# System prompt for legal AI assistant (CACHED)
def get_system_prompt():
    """Get system prompt with caching for performance."""
    # Try cache first
    cached_prompt = cache.get(SYSTEM_PROMPT_CACHE_KEY)
    if cached_prompt:
        return cached_prompt
    
    # Friendly, conversational system prompt focused on cases and statutes
    prompt = """You are Angel AI 👼, a friendly and supportive legal tutor created by Law Angels to help students prepare for the SQE!

Your personality:
✨ Be warm, encouraging, and supportive - you're a friend helping with studies!
💬 Use a conversational tone, not formal academic writing
🎯 Keep answers focused and exam-relevant
🇬🇧 Focus on UK law unless asked otherwise
😊 Use occasional emojis to be friendly, but don't overdo it

When answering legal questions:
⚖️ Always cite relevant cases when discussing legal principles (e.g. R v Woollin [1999], Donoghue v Stevenson [1932])
📜 Reference key statutes when applicable (e.g. Theft Act 1968, s.1)
📖 If you're given legal resource excerpts, use that information to support your answer
🔍 Explain legal principles clearly with practical examples

CRITICAL FORMATTING RULES:
❌ NEVER use markdown bold or headers (no ** or ##) please dont try to bolden or make headers
✅ Write naturally like texting a friend who needs help with law
✅ Use bullet points with - or • for lists

You cover: Contract Law, Criminal Law, Property Law, Trusts, Constitutional Law, Tort Law, Ethics, Wills, Business Law, Dispute Resolution, Solicitors' Accounts"""
    
    # Cache the prompt
    cache.set(SYSTEM_PROMPT_CACHE_KEY, prompt, CACHE_TTL)
    return prompt


class AngelAIViewSet(viewsets.ViewSet):
    """
    ViewSet for Angel AI chat functionality.
    
    Endpoints:
    - POST /ai/chat/ - Send a message and get AI response (non-streaming)
    - POST /ai/stream/ - Send a message and get streaming AI response
    - GET /ai/conversations/ - List user's chat conversations
    - POST /ai/conversations/ - Create a new conversation
    - GET /ai/conversations/{id}/ - Get conversation with messages
    - DELETE /ai/conversations/{id}/ - Delete a conversation
    - POST /ai/conversations/{id}/message/ - Add a message to conversation
    """
    permission_classes = [IsAuthenticated]
    
    def _get_openai_client(self):
        """Get OpenAI client configured for OpenRouter."""
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError("openai package is required. Install with: pip install openai")
        
        api_key = os.environ.get('OPENROUTER_API_KEY')
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is not set")
        
        base_url = os.environ.get('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
        
        return OpenAI(
            base_url=base_url,
            api_key=api_key,
        )
    
    def _needs_rag_search(self, message: str) -> bool:
        """
        Determine if a message needs RAG search.
        Skip RAG for casual greetings and short non-legal messages.
        """
        # Clean and lowercase the message
        msg_lower = message.lower().strip()
        msg_words = msg_lower.split()
        
        # Skip RAG for very short messages (likely greetings)
        if len(msg_words) <= 3:
            # Check if it's just a greeting
            greetings = {
                'hi', 'hello', 'hey', 'yo', 'hiya', 'howdy',
                'good morning', 'good afternoon', 'good evening',
                'thanks', 'thank you', 'cheers', 'bye', 'goodbye',
                'ok', 'okay', 'sure', 'yes', 'no', 'yeah', 'nah',
                'cool', 'nice', 'great', 'awesome', 'perfect',
                'help', 'help me', "what's up", 'whats up', 'sup'
            }
            if msg_lower in greetings or any(g in msg_lower for g in greetings):
                logger.info(f"Skipping RAG for greeting/short message: {msg_lower}")
                return False
        
        # Legal keywords that indicate a question needs RAG
        legal_keywords = {
            'law', 'legal', 'case', 'statute', 'act', 'section',
            'murder', 'theft', 'robbery', 'assault', 'battery',
            'contract', 'tort', 'negligence', 'duty', 'breach',
            'crime', 'criminal', 'prosecution', 'defendant', 'claimant',
            'property', 'land', 'lease', 'trust', 'trustee',
            'solicitor', 'barrister', 'court', 'judge', 'trial',
            'liability', 'damages', 'remedy', 'injunction',
            'sqe', 'exam', 'ethics', 'professional', 'accounts',
            'explain', 'what is', 'what are', 'how does', 'define',
            'elements', 'requirements', 'test', 'principle'
        }
        
        # Check if message contains any legal keywords
        for keyword in legal_keywords:
            if keyword in msg_lower:
                return True
        
        # If message is longer (>5 words) and looks like a question, use RAG
        if len(msg_words) > 5 and ('?' in message or any(q in msg_lower for q in ['what', 'how', 'why', 'when', 'explain', 'describe'])):
            return True
        
        # Default: skip RAG for ambiguous short messages
        if len(msg_words) <= 5:
            logger.info(f"Skipping RAG for short non-legal message: {msg_lower}")
            return False
        
        # For longer messages, assume they might be legal questions
        return True
    
    def _build_messages(self, message: str, conversation_history: list) -> list:
        """Build the messages array for the API call with RAG context. OPTIMIZED."""
        messages = [
            {"role": "system", "content": get_system_prompt()}
        ]
        
        # Add conversation history (limit to last 6 messages for speed)
        for msg in conversation_history[-6:]:
            role = msg.get('role', 'user')
            if role == 'ai':
                role = 'assistant'
            messages.append({
                "role": role,
                "content": msg.get('content', '')
            })
        
        # RAG search - retrieve relevant legal content from Pinecone
        # Skip RAG for casual messages (greetings, short messages, etc.)
        rag_context = ""
        
        # Check if message needs RAG (is it a legal question?)
        needs_rag = self._needs_rag_search(message)
        
        if needs_rag and os.environ.get('DISABLE_RAG', 'false').lower() != 'true':
            try:
                from . import pinecone_service
                # Use Pinecone semantic search for relevant cases/statutes
                results = pinecone_service.search_relevant_content(message, top_k=3)
                if results:
                    rag_context = pinecone_service.format_context_for_prompt(results)
                    logger.info(f"Pinecone RAG found {len(results)} relevant chunks")
            except Exception as e:
                logger.warning(f"Pinecone RAG search error: {e}")
        
        # Add current message with RAG context
        if rag_context:
            augmented_message = f"""Here's relevant legal content (cases and statutes) to help answer this question:

{rag_context}

Student's question: {message}

Please:
1. Use the legal content above to inform your answer
2. Cite any relevant cases mentioned (e.g. R v Woollin [1999])
3. Reference any statutes mentioned (e.g. Theft Act 1968)
4. Explain the legal principles clearly
5. If you use knowledge beyond the excerpts, that's fine too!"""
        else:
            augmented_message = message
        
        messages.append({
            "role": "user",
            "content": augmented_message
        })
        
        return messages
    
    @action(detail=False, methods=['post'])
    def chat(self, request):
        """
        Send a message to Angel AI and get a response (non-streaming).
        """
        try:
            message = request.data.get('message')
            if not message:
                return Response(
                    {'error': 'Message is required', 'success': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            conversation_history = request.data.get('conversation_history', [])
            messages = self._build_messages(message, conversation_history)
            
            client = self._get_openai_client()
            model = os.environ.get('OPENROUTER_MODEL', 'openai/gpt-3.5-turbo')
            
            logger.info(f"Angel AI request from user {request.user.username}: {message[:100]}...")
            
            completion = client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": "https://lawangels.com",
                    "X-Title": "Law Angels SQE Prep",
                },
                model=model,
                messages=messages,
                max_tokens=500,  # Concise for faster responses
                temperature=0.5,  # Lower for more consistent, faster responses
            )
            
            ai_response = completion.choices[0].message.content
            
            logger.info(f"Angel AI response generated for user {request.user.username}")
            
            return Response({
                'response': ai_response,
                'success': True,
            })
            
        except Exception as e:
            logger.error(f"Error in Angel AI chat: {str(e)}")
            return Response(
                {'error': f'AI service error: {str(e)}', 'success': False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def stream(self, request):
        """
        Send a message to Angel AI and get a streaming response.
        Uses Server-Sent Events (SSE) for real-time streaming.
        """
        try:
            message = request.data.get('message')
            if not message:
                return Response(
                    {'error': 'Message is required', 'success': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            conversation_history = request.data.get('conversation_history', [])
            messages = self._build_messages(message, conversation_history)
            
            client = self._get_openai_client()
            model = os.environ.get('OPENROUTER_MODEL', 'openai/gpt-3.5-turbo')
            
            logger.info(f"Angel AI stream request from user {request.user.username}: {message[:100]}...")
            
            def generate():
                try:
                    stream = client.chat.completions.create(
                        extra_headers={
                            "HTTP-Referer": "https://lawangels.com",
                            "X-Title": "Law Angels SQE Prep",
                        },
                        model=model,
                        messages=messages,
                        max_tokens=500,  # Concise for faster responses
                        temperature=0.5,  # Lower for faster, more consistent responses
                        stream=True,
                    )
                    
                    for chunk in stream:
                        if chunk.choices[0].delta.content:
                            content = chunk.choices[0].delta.content
                            # Send as SSE format
                            yield f"data: {json.dumps({'content': content})}\n\n"
                    
                    # Send completion signal
                    yield f"data: {json.dumps({'done': True})}\n\n"
                    
                except Exception as e:
                    logger.error(f"Error in streaming: {str(e)}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
            response = StreamingHttpResponse(
                generate(),
                content_type='text/event-stream'
            )
            response['Cache-Control'] = 'no-cache'
            response['X-Accel-Buffering'] = 'no'
            return response
            
        except Exception as e:
            logger.error(f"Error in Angel AI stream: {str(e)}")
            return Response(
                {'error': f'AI service error: {str(e)}', 'success': False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ============ Conversation CRUD Methods ============

    @action(detail=False, methods=['get', 'post'])
    def conversations(self, request):
        """
        GET: List user's chat conversations
        POST: Create a new conversation
        """
        if request.method == 'GET':
            # OPTIMIZED: Use values() for minimal data transfer
            from django.db.models import Count
            conversations = ChatConversation.objects.filter(
                user=request.user
            ).annotate(
                msg_count=Count('messages')
            ).values(
                'id', 'title', 'created_at', 'updated_at', 'msg_count'
            ).order_by('-updated_at')[:20]  # Limit to 20 most recent
            
            data = [{
                'id': conv['id'],
                'title': conv['title'],
                'created_at': conv['created_at'].isoformat() if conv['created_at'] else '',
                'updated_at': conv['updated_at'].isoformat() if conv['updated_at'] else '',
                'message_count': conv['msg_count']
            } for conv in conversations]
            return Response({'conversations': data, 'success': True})
        
        elif request.method == 'POST':
            title = request.data.get('title', 'New Chat')
            conversation = ChatConversation.objects.create(
                user=request.user,
                title=title
            )
            return Response({
                'id': conversation.id,
                'title': conversation.title,
                'created_at': conversation.created_at.isoformat(),
                'success': True
            }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get', 'delete'], url_path='conversations/(?P<conversation_id>[^/.]+)')
    def conversation_detail(self, request, conversation_id=None):
        """
        GET: Get a single conversation with all messages
        DELETE: Delete a conversation
        """
        try:
            conversation = ChatConversation.objects.get(
                id=conversation_id,
                user=request.user
            )
        except ChatConversation.DoesNotExist:
            return Response(
                {'error': 'Conversation not found', 'success': False},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == 'GET':
            messages = [{
                'role': msg.role,
                'content': msg.content,
                'timestamp': msg.timestamp.strftime('%I:%M %p')
            } for msg in conversation.messages.all()]
            
            return Response({
                'id': conversation.id,
                'title': conversation.title,
                'created_at': conversation.created_at.isoformat(),
                'updated_at': conversation.updated_at.isoformat(),
                'messages': messages,
                'success': True
            })
        
        elif request.method == 'DELETE':
            conversation.delete()
            return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='conversations/(?P<conversation_id>[^/.]+)/message')
    def add_message(self, request, conversation_id=None):
        """Add a message to an existing conversation. OPTIMIZED."""
        try:
            conversation = ChatConversation.objects.get(
                id=conversation_id,
                user=request.user
            )
        except ChatConversation.DoesNotExist:
            return Response(
                {'error': 'Conversation not found', 'success': False},
                status=status.HTTP_404_NOT_FOUND
            )

        role = request.data.get('role')
        content = request.data.get('content')

        if not role or not content:
            return Response(
                {'error': 'role and content are required', 'success': False},
                status=status.HTTP_400_BAD_REQUEST
            )

        if role not in ['user', 'ai']:
            return Response(
                {'error': 'role must be "user" or "ai"', 'success': False},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create message
        message = ChatMessage.objects.create(
            conversation=conversation,
            role=role,
            content=content
        )

        # Update conversation - only save once with update_fields for efficiency
        fields_to_update = ['updated_at']
        
        # Update title if first user message
        if conversation.title == 'New Chat' and role == 'user':
            title = content[:40].strip()
            if len(content) > 40:
                title = title + '...'
            conversation.title = title
            fields_to_update.append('title')
        
        # Single efficient save with only changed fields
        conversation.save(update_fields=fields_to_update)

        return Response({
            'id': message.id,
            'role': message.role,
            'content': message.content,
            'timestamp': message.timestamp.strftime('%I:%M %p'),
            'conversation_title': conversation.title,
            'success': True
        }, status=status.HTTP_201_CREATED)
