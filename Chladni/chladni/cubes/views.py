from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
import numpy as np
from skimage.measure import marching_cubes

def home(request):
    return render(request, 'index.html')

def chladni_3d_pattern(x, y, z, u=1, v=1, w=1, A=1, B=1, C=1, D=1, E=1, F=1, boundary='dirichlet'):
    pi = np.pi
    if boundary == 'dirichlet':
        term1 = A * np.sin(u * pi * x) * np.sin(v * pi * y) * np.sin(w * pi * z)
        term2 = B * np.sin(u * pi * x) * np.sin(v * pi * z) * np.sin(w * pi * y)
        term3 = C * np.sin(u * pi * y) * np.sin(v * pi * x) * np.sin(w * pi * z)
        term4 = D * np.sin(u * pi * y) * np.sin(v * pi * z) * np.sin(w * pi * x)
        term5 = E * np.sin(u * pi * z) * np.sin(v * pi * x) * np.sin(w * pi * y)
        term6 = F * np.sin(u * pi * z) * np.sin(v * pi * y) * np.sin(w * pi * x)
    elif boundary == 'neumann':
        term1 = A * np.cos(u * pi * x) * np.cos(v * pi * y) * np.cos(w * pi * z)
        term2 = B * np.cos(u * pi * x) * np.cos(v * pi * z) * np.cos(w * pi * y)
        term3 = C * np.cos(u * pi * y) * np.cos(v * pi * x) * np.cos(w * pi * z)
        term4 = D * np.cos(u * pi * y) * np.cos(v * pi * z) * np.cos(w * pi * x)
        term5 = E * np.cos(u * pi * z) * np.cos(v * pi * x) * np.cos(w * pi * y)
        term6 = F * np.cos(u * pi * z) * np.cos(v * pi * y) * np.cos(w * pi * x)

    return term1 + term2 + term3 + term4 + term5 + term6

def generate_chladni_scalar_field(resolution=50, u=1, v=1, w=1, A=1, B=1, C=1, D=1, E=1, F=1, min_x=-1, min_y=-1, min_z=-1, max_x=1, max_y=1, max_z=1, boundary='dirichlet'):
    x = np.linspace(min_x, max_x, resolution)
    y = np.linspace(min_y, max_y, resolution)
    z = np.linspace(min_z, max_z, resolution)
    X, Y, Z = np.meshgrid(x, y, z)
    scalar_field = chladni_3d_pattern(X, Y, Z, u=u, v=v, w=w, A=A, B=B, C=C, D=D, E=E, F=F, boundary=boundary)
    return scalar_field

@api_view(['GET'])
def generate_chladni_pattern(request):
    resolution = 100
    u = float(request.GET.get('u', 1))
    v = float(request.GET.get('v', 1))
    w = float(request.GET.get('w', 1))
    A = float(request.GET.get('A', 1))
    B = float(request.GET.get('B', 1))
    C = float(request.GET.get('C', 1))
    D = float(request.GET.get('D', 1))
    E = float(request.GET.get('E', 1))
    F = float(request.GET.get('F', 1))
    min_x = float(request.GET.get('min_x', -1))
    min_y = float(request.GET.get('min_y', -1))
    min_z = float(request.GET.get('min_z', -1))
    max_x = float(request.GET.get('max_x', 1))
    max_y = float(request.GET.get('max_y', 1))
    max_z = float(request.GET.get('max_z', 1))
    boundary = request.GET.get('boundary', 'dirichlet')

    scalar_field = generate_chladni_scalar_field(resolution, u=u, v=v, w=w, A=A, B=B, C=C, D=D, E=E, F=F,
                                                 min_x=min_x, min_y=min_y, min_z=min_z, max_x=max_x, max_y=max_y, max_z=max_z,
                                                 boundary=boundary)
    verts, faces, normals, values = marching_cubes(scalar_field, level=0)

    return Response({
        'vertices': verts.tolist(),
        'faces': faces.tolist()
    })
