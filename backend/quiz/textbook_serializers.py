from rest_framework import serializers
from .textbook_models import Textbook


class TextbookSerializer(serializers.ModelSerializer):
    """Serializer for Textbook model."""
    
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Textbook
        fields = [
            'id',
            'title',
            'subject',
            'description',
            'category',
            'category_display',
            'file_name',
            'icon',
            'order',
            'chapters',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class TextbookListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing textbooks."""
    
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Textbook
        fields = [
            'id',
            'title',
            'subject',
            'category',
            'category_display',
            'icon',
        ]
