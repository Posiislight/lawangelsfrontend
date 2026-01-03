"""
Angel AI Views - LangChain Integration with OpenRouter

Provides AI chat functionality for the Angel AI feature using OpenRouter API.
Includes streaming responses and RAG-based context from textbooks.
"""

import os
import json
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import StreamingHttpResponse
from django.conf import settings


from .textbook_models import Textbook
from .chat_models import ChatConversation, ChatMessage

logger = logging.getLogger(__name__)

# Get textbook knowledge for system prompt
def get_textbook_context():
    """Build context from available textbooks."""
    try:
        textbooks = Textbook.objects.all()
        context_parts = []
        for book in textbooks:
            chapters_info = ""
            if book.chapters:
                chapter_titles = [ch.get('title', '') for ch in book.chapters[:10]]  # First 10 chapters
                chapters_info = f" Key topics: {', '.join(chapter_titles)}"
            context_parts.append(f"- {book.title} ({book.subject}){chapters_info}")
        return "\n".join(context_parts) if context_parts else "No textbooks available."
    except Exception as e:
        logger.error(f"Error getting textbook context: {e}")
        return "Law Angels textbooks covering SQE topics."

# System prompt for legal AI assistant
def get_system_prompt():
    textbook_context = get_textbook_context()
    
    return f"""You are Angel AI, an expert legal tutor created by Law Angels to help students prepare for the SQE (Solicitors Qualifying Examination) in England and Wales.

## Your Identity
- Your name is **Angel AI**
- You were created by Law Angels as part of their SQE preparation platform
- You are friendly, supportive, and encouraging to students
- You explain complex legal concepts in clear, accessible language

## Your Knowledge Base
You have access to the Law Angels textbook library which covers:
{textbook_context}

## How to Answer Questions
1. **First, check your textbook knowledge**: If the question relates to topics covered in the Law Angels textbooks, base your answer on that authoritative content
2. **Cite sources when possible**: Reference relevant cases, statutes, and legal principles
3. **If not in textbooks**: You may use your general legal knowledge, but mention that the topic may require additional research
4. **Always focus on UK law**: Unless specifically asked about other jurisdictions

## Response Guidelines
- Use clear headings and bullet points for readability
- Include relevant case law citations (e.g., "Donoghue v Stevenson [1932] AC 562")
- Provide practical examples where helpful
- Be encouraging and supportive to students
- If you're unsure, acknowledge uncertainty rather than guessing
- Keep responses focused and exam-relevant

## Key Areas of Expertise (from Law Angels curriculum)
- Contract Law (offer, acceptance, consideration, terms, remedies)
- Criminal Law and Practice (actus reus, mens rea, defences, procedure)
- Property Law and Land Law (estates, interests, registration)
- Trusts and Equity (express trusts, resulting trusts, constructive trusts)
- Constitutional and Administrative Law (judicial review, human rights)
- Tort Law (negligence, duty of care, breach, causation)
- Professional Ethics and Conduct (SRA Code of Conduct)
- Wills and Administration of Estates
- Business Law and Company Law
- Dispute Resolution (litigation, ADR)
- Solicitors' Accounts
- Taxation

Remember: You are Angel AI, here to help Law Angels students succeed in their SQE examinations!"""


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
        """Build the messages array for the API call."""
        messages = [
            {"role": "system", "content": get_system_prompt()}
        ]
        
        # Add conversation history (limit to last 10 messages)
        for msg in conversation_history[-10:]:
            role = msg.get('role', 'user')
            if role == 'ai':
                role = 'assistant'
            messages.append({
                "role": role,
                "content": msg.get('content', '')
            })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": message
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
                max_tokens=1500,
                temperature=0.7,
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
                        max_tokens=1500,
                        temperature=0.7,
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
            conversations = ChatConversation.objects.filter(user=request.user)
            data = [{
                'id': conv.id,
                'title': conv.title,
                'created_at': conv.created_at.isoformat(),
                'updated_at': conv.updated_at.isoformat(),
                'message_count': conv.messages.count()
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
        """Add a message to an existing conversation."""
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

        message = ChatMessage.objects.create(
            conversation=conversation,
            role=role,
            content=content
        )

        # Update conversation title based on first user message if it's still "New Chat"
        if conversation.title == 'New Chat' and role == 'user':
            # Generate title from first message
            title = content[:40].strip()
            if len(content) > 40:
                title = title + '...'
            conversation.title = title
            conversation.save()

        # Update the conversation's updated_at timestamp
        conversation.save()

        return Response({
            'id': message.id,
            'role': message.role,
            'content': message.content,
            'timestamp': message.timestamp.strftime('%I:%M %p'),
            'conversation_title': conversation.title,
            'success': True
        }, status=status.HTTP_201_CREATED)
