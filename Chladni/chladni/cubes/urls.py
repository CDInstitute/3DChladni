from django.urls import path
from .views import generate_chladni_pattern

urlpatterns = [
    path('chladni-pattern/', generate_chladni_pattern, name='chladni_pattern'),  
]
