from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class UserGameProfile(models.Model):
    """
    Tracks user's overall gamification progress across all topic quizzes.
    Created automatically when a user starts their first topic quiz.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='game_profile')
    total_points = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    current_level = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    xp = models.IntegerField(default=0, validators=[MinValueValidator(0)])  # XP towards next level
    xp_to_next_level = models.IntegerField(default=500)  # XP needed to level up
    
    # Stats
    total_quizzes_completed = models.IntegerField(default=0)
    total_correct_answers = models.IntegerField(default=0)
    total_wrong_answers = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)  # Longest correct answer streak
    
    # Rank title based on level
    RANK_CHOICES = [
        ('rookie_scholar', 'Rookie Scholar'),
        ('law_apprentice', 'Law Apprentice'),
        ('legal_explorer', 'Legal Explorer'),
        ('case_analyst', 'Case Analyst'),
        ('statute_sage', 'Statute Sage'),
        ('justice_seeker', 'Justice Seeker'),
        ('legal_legend', 'Legal Legend'),
    ]
    rank = models.CharField(max_length=50, choices=RANK_CHOICES, default='rookie_scholar')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Game Profile"
        verbose_name_plural = "User Game Profiles"

    def __str__(self):
        return f"{self.user.username} - Level {self.current_level} ({self.get_rank_display()})"

    def add_xp(self, amount):
        """Add XP and handle level ups"""
        self.xp += amount
        self.total_points += amount
        
        # Check for level up
        while self.xp >= self.xp_to_next_level:
            self.xp -= self.xp_to_next_level
            self.current_level += 1
            # Increase XP needed for next level
            self.xp_to_next_level = int(self.xp_to_next_level * 1.2)
            # Update rank based on level
            self._update_rank()
        
        self.save()

    def _update_rank(self):
        """Update rank based on current level"""
        if self.current_level >= 50:
            self.rank = 'legal_legend'
        elif self.current_level >= 30:
            self.rank = 'justice_seeker'
        elif self.current_level >= 20:
            self.rank = 'statute_sage'
        elif self.current_level >= 12:
            self.rank = 'case_analyst'
        elif self.current_level >= 7:
            self.rank = 'legal_explorer'
        elif self.current_level >= 3:
            self.rank = 'law_apprentice'
        else:
            self.rank = 'rookie_scholar'


class TopicQuizAttempt(models.Model):
    """
    Tracks individual topic quiz attempts with gamification state.
    Each attempt is for a specific topic with a set number of questions.
    """
    TOPIC_CHOICES = [
        ('taxation', 'Taxation'),
        ('criminal_law', 'Criminal Law'),
        ('criminal_practice', 'Criminal Practice'),
        ('land_law', 'Land Law'),
        ('solicitors_accounts', 'Solicitors Accounts'),
        ('professional_ethics', 'Professional Ethics'),
        ('trusts', 'Trusts'),
        ('wills', 'Wills'),
    ]
    
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),  # Ran out of lives
        ('abandoned', 'Abandoned'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topic_quiz_attempts')
    # Dynamic topic slugs from PracticeQuestionTopic
    topic = models.CharField(max_length=200, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    
    # Game state
    lives_remaining = models.IntegerField(default=3, validators=[MinValueValidator(0), MaxValueValidator(5)])
    points_earned = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    current_streak = models.IntegerField(default=0)  # Current correct answer streak
    
    # Snapshot of questions for this attempt (Performance optimization)
    # Stores list of dicts: [{id, text, options, correct_answer, explanation, ...}]
    questions_snapshot = models.JSONField(null=True, blank=True)
    
    # Cache of correct answers {str(id): 'A'} for instant checking
    correct_answers = models.JSONField(default=dict)
    
    # Progress
    current_question_index = models.IntegerField(default=0)  # 0-indexed position
    total_questions = models.IntegerField(default=5)
    correct_count = models.IntegerField(default=0)
    wrong_count = models.IntegerField(default=0)
    
    # Power-ups used
    fifty_fifty_used = models.BooleanField(default=False)
    time_freeze_used = models.BooleanField(default=False)
    
    # Questions for this attempt (stored as comma-separated IDs for simplicity)
    question_ids = models.TextField(blank=True)  # Format: "1,5,12,8,3"
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', '-started_at']),
            models.Index(fields=['topic', 'status']),
        ]
        verbose_name = "Topic Quiz Attempt"
        verbose_name_plural = "Topic Quiz Attempts"

    def __str__(self):
        return f"{self.user.username} - {self.topic} ({self.status})"

    def get_question_id_list(self):
        """Return list of question IDs"""
        if not self.question_ids:
            return []
        return [int(qid) for qid in self.question_ids.split(',') if qid]

    def set_question_id_list(self, id_list):
        """Set question IDs from list"""
        self.question_ids = ','.join(str(qid) for qid in id_list)

    def record_answer(self, is_correct):
        """
        Record an answer and update game state.
        Returns points earned for this answer.
        """
        points = 0
        
        if is_correct:
            self.correct_count += 1
            self.current_streak += 1
            
            # Base points
            points = 100
            
            # Streak bonus (10 extra points per streak level, max +50)
            streak_bonus = min(self.current_streak - 1, 5) * 10
            points += streak_bonus
            
            self.points_earned += points
        else:
            self.wrong_count += 1
            self.current_streak = 0
            self.lives_remaining -= 1
            
            # Check if out of lives
            if self.lives_remaining <= 0:
                self.status = 'failed'
        
        # Move to next question
        self.current_question_index += 1
        
        # Check if quiz completed
        if self.current_question_index >= self.total_questions:
            if self.status != 'failed':
                self.status = 'completed'
        
        self.save()
        return points


class TopicQuizAnswer(models.Model):
    """
    Records individual answers within a topic quiz attempt.
    """
    attempt = models.ForeignKey(TopicQuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question_id = models.IntegerField()  # Reference to Question model
    selected_answer = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D'), ('E', 'E')])
    is_correct = models.BooleanField()
    points_earned = models.IntegerField(default=0)
    time_spent_seconds = models.IntegerField(default=0)
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['answered_at']
        unique_together = ['attempt', 'question_id']

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"Attempt {self.attempt.id} - Q{self.question_id} {status}"
