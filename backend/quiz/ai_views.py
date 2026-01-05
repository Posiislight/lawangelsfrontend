"""
Angel AI Views - LangChain Integration with OpenRouter

Provides AI chat functionality for the Angel AI feature using OpenRouter API.
Includes streaming responses and RAG-based context from textbooks.
OPTIMIZED: Caches system prompt and uses faster response settings.
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


from .textbook_models import Textbook
from .chat_models import ChatConversation, ChatMessage

logger = logging.getLogger(__name__)

# Cache keys and TTL
TEXTBOOK_CONTEXT_CACHE_KEY = 'angel_ai_textbook_context'
SYSTEM_PROMPT_CACHE_KEY = 'angel_ai_system_prompt'
CACHE_TTL = 3600  # 1 hour


def clean_markdown_formatting(text: str) -> str:
    """Remove unwanted markdown formatting from AI responses."""
    if not text:
        return text
    
    # Remove **bold** formatting -> just the text inside
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    
    # Remove __bold__ formatting -> just the text inside  
    text = re.sub(r'__([^_]+)__', r'\1', text)
    
    # Remove ## headers -> just the text (keep on same line)
    text = re.sub(r'^#{1,6}\s+(.+)$', r'\1', text, flags=re.MULTILINE)
    
    return text

# Get textbook knowledge for system prompt (CACHED)
def get_textbook_context():
    """Build context from available textbooks. Uses cache for performance."""
    # Try cache first
    cached_context = cache.get(TEXTBOOK_CONTEXT_CACHE_KEY)
    if cached_context:
        return cached_context
    
    try:
        textbooks = Textbook.objects.only('title', 'subject', 'chapters').all()
        context_parts = []
        for book in textbooks:
            chapters_info = ""
            if book.chapters:
                chapter_titles = [ch.get('title', '') for ch in book.chapters[:5]]  # First 5 chapters only
                chapters_info = f" Topics: {', '.join(chapter_titles)}"
            context_parts.append(f"- {book.title} ({book.subject}){chapters_info}")
        context = "\n".join(context_parts) if context_parts else "Law Angels SQE textbooks."
        
        # Cache the result
        cache.set(TEXTBOOK_CONTEXT_CACHE_KEY, context, CACHE_TTL)
        return context
    except Exception as e:
        logger.error(f"Error getting textbook context: {e}")
        return "Law Angels textbooks covering SQE topics."

# System prompt for legal AI assistant (CACHED)
def get_system_prompt():
    """Get system prompt with caching for performance."""
    # Try cache first
    cached_prompt = cache.get(SYSTEM_PROMPT_CACHE_KEY)
    if cached_prompt:
        return cached_prompt
    
    textbook_context = get_textbook_context()
    
    # Friendly, conversational system prompt
    prompt = f"""You are Angel AI 👼, a friendly and supportive legal tutor created by Law Angels to help students prepare for the SQE!

You have knowledge of these Law Angels textbooks:
{textbook_context}

Your personality:
✨ Be warm, encouraging, and supportive - you're a friend helping with studies!
💬 Use a conversational tone, not formal academic writing
🎯 Keep answers focused and exam-relevant
🇬🇧 Focus on UK law unless asked otherwise
😊 Use occasional emojis to be friendly, but don't overdo it

When answering legal questions:
📚 Always cite relevant cases when discussing legal principles (e.g. R v Smith [1959], Donoghue v Stevenson [1932])
📜 Reference key statutes when applicable (e.g. Theft Act 1968, s.1)
📖 If you're given textbook excerpts, reference which textbook the info came from
⚖️ Explain legal principles clearly with practical examples

CRITICAL FORMATTING RULES:
❌ NEVER use markdown bold or headers (no ** or ##)
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
        
        # RAG search - retrieve relevant textbook content using fast keyword search
        # Set DISABLE_RAG=true to disable if needed
        rag_context = ""
        if os.environ.get('DISABLE_RAG', 'false').lower() != 'true':
            try:
                from . import rag_service
                # Use fast keyword search (no API calls, instant results)
                results = rag_service.fast_keyword_search(message, top_k=3)
                if results:
                    rag_context = rag_service.format_context_for_prompt(results)
                    logger.info(f"RAG found {len(results)} relevant chunks (keyword search)")
            except Exception as e:
                logger.warning(f"RAG search error: {e}")
        
        # Add current message with RAG context
        if rag_context:
            augmented_message = f"""Here's relevant content from Law Angels textbooks to help answer this question:

{rag_context}

Student's question: {message}

Please:
1. Use the textbook content above to inform your answer
2. Cite any relevant cases mentioned (e.g. R v Smith [1959])
3. Reference any statutes mentioned (e.g. Theft Act 1968)
4. Note which textbook the information came from
5. If you use knowledge beyond the textbook excerpts, that's fine too!"""
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
            
            # Clean markdown formatting from response
            ai_response = clean_markdown_formatting(ai_response)
            
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
                            # Clean markdown formatting from each chunk
                            content = clean_markdown_formatting(content)
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
            # Optimized: annotate message count instead of calling count() per object
            from django.db.models import Count
            conversations = ChatConversation.objects.filter(
                user=request.user
            ).annotate(
                msg_count=Count('messages')
            ).order_by('-updated_at')[:20]  # Limit to 20 most recent
            
            data = [{
                'id': conv.id,
                'title': conv.title,
                'created_at': conv.created_at.isoformat(),
                'updated_at': conv.updated_at.isoformat(),
                'message_count': conv.msg_count
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
