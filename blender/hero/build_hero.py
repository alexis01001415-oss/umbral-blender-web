"""UMBRAL / A room for light. Independent, reproducible Eevee hero scene.

Run: blender --background --factory-startup --python blender/hero/build_hero.py
This file NEVER opens or modifies the original Umbral.blend room scene.
"""
from pathlib import Path
import bpy, math, json, random
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
OUT=ROOT/'public'/'hero'
HERE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.unit_settings.system='METRIC';scene.render.fps=24;scene.frame_start=1;scene.frame_end=145
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=False
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.view_settings.exposure=.5
scene.world.color=(.5,.45,.38)
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.68,.62,.52,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.45

def group(name,parent=None):
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=parent
    o.empty_display_type='PLAIN_AXES';o.empty_display_size=.2;return o
root=group('ROOT_Hero_Umbral')
architecture=group('01_Architecture',root)
blind=group('02_Blind_Assembly',root)
texture_space=group('CONTROL_Fixed_Weave_Space',blind)
texture_space.location=(0,-.065,3.635)
texture_space['note']='Fixed textile coordinate space: weave and horizontal bands keep their physical scale while the fabric deploys.'
exterior=group('03_Exterior',root)
lighting=group('04_Studio_Lighting',root)
cameras=group('05_Cameras',root)
details=group('06_Architectural_Details',root)
root['README']='New independent hero. 1 = open, 145 = closed. Move assemblies with numbered empties. Front cameras are static and registered for scroll compositing.'
blind['operation']='Motorized roller. Textile origin fixed at cassette; linear 6-second deployment. Mobile layout variant scales architecture X to 0.55.'

def rgb(h):
    a=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a)

def material(name,h,rough=.5,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb(h),1)
    p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    m.diffuse_color=(*rgb(h),1);return m

wall=material('Lime plaster · warm ivory','DFD3BF',.94)
wood=material('Smoked oak · 523822','523822',.46)
frame=material('Anodized bronze · 41250c','41250c',.33,.65)
rubber=material('Light seals · 190e03','190e03',.95)
metal=material('Cassette · 261405','261405',.38,.58)
stone=material('Honed travertine · limestone','DACCB4',.72)
cloth=material('Opaque woven espresso · 2d1805','2d1805',.94)
cloth.node_tree.nodes.get('Principled BSDF').inputs['Sheen Weight'].default_value=.025
bronze=material('Satin warm brass','9A754D',.37,.7)

# Actual micro-relief keeps the fabric tactile at full resolution.
nodes=cloth.node_tree.nodes;links=cloth.node_tree.links;shader=nodes.get('Principled BSDF')
tex=nodes.new('ShaderNodeTexCoord');tex.object=texture_space
separate=nodes.new('ShaderNodeSeparateXYZ');links.new(tex.outputs['Object'],separate.inputs[0])
wave=nodes.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='Z';wave.inputs['Scale'].default_value=.7;wave.inputs['Distortion'].default_value=0
links.new(tex.outputs['Object'],wave.inputs['Vector'])
ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.48;ramp.color_ramp.elements[1].position=.54
ramp.color_ramp.elements[0].color=(*(v*.25 for v in rgb('21170F')),1);ramp.color_ramp.elements[1].color=(*(v*.25 for v in rgb('261B12')),1)
links.new(wave.outputs['Color'],ramp.inputs['Fac']);links.new(ramp.outputs['Color'],shader.inputs['Base Color'])
noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=550;noise.inputs['Detail'].default_value=2;noise.inputs['Roughness'].default_value=.75
links.new(tex.outputs['Object'],noise.inputs['Vector']);bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.3;bump.inputs['Distance'].default_value=.004
links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],shader.inputs['Normal'])

for m,scale,distance in [(wall,95,.006),(wood,8,.006),(stone,25,.003)]:
    n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
    co=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=scale;noise.inputs['Detail'].default_value=3
    l.new(co.outputs['Generated'],noise.inputs['Vector']);b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.17;b.inputs['Distance'].default_value=distance
    l.new(noise.outputs['Fac'],b.inputs['Height']);l.new(b.outputs['Normal'],p.inputs['Normal'])

def box(name,loc,size,mat,parent=architecture,bevel=.01):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0));o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.parent=parent;o.location=loc
    if mat:o.data.materials.append(mat)
    if bevel:
        m=o.modifiers.new('Rounded architectural edges','BEVEL');m.width=bevel;m.segments=4
        m=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def cylinder(name,loc,radius,depth,mat,parent=blind):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=radius,depth=depth)
    o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.rotation_euler.y=math.pi/2;o.data.materials.append(mat)
    m=o.modifiers.new('Machined edge','BEVEL');m.width=.01;m.segments=3
    for f in o.data.polygons:f.use_smooth=True
    return o

# Thick plaster reveals, dark slender frames, and a deep honed sill.
box('Wall_L',(-4.28,.26,2.14),(3,.62,6),wall)
box('Wall_R',(4.28,.26,2.14),(3,.62,6),wall)
box('Wall_Above',(0,.26,4.55),(5.6,.62,1.48),wall)
box('Wall_Below',(0,.26,-.37),(5.6,.62,1.2),wall)
for x,sign in [(-2.77,-1),(2.77,1)]:
    box('Solid oak reveal '+str(sign),(x,.1,2.07),(.16,.52,3.55),wood)
    box('Bronze side frame '+str(sign),(x-sign*.085,.39,2.07),(.055,.11,3.45),frame)
    box('Continuous light seal '+str(sign),(x-sign*.12,-.033,2.07),(.027,.038,3.43),rubber,blind,.004)
    box('Stone jamb '+str(sign),(x+sign*.15,-.08,2.03),(.12,.3,3.65),stone)
box('Bronze frame top',(0,.4,3.82),(5.34,.12,.075),frame)
box('Bronze frame base',(0,.39,.345),(5.34,.12,.08),frame)
box('Travertine sill',(0,-.04,.27),(5.82,.95,.15),stone,bevel=.024)
box('Sill shadow reveal',(0,-.49,.16),(5.76,.03,.048),rubber)
box('Top deep reveal',(0,.1,3.86),(5.56,.52,.13),wood)
for x in [-3.15,3.15]:
    box('Vertical oak wall detail '+str(x),(x,-.073,2.1),(.09,.04,5),wood)

# Cassette with end caps and roller. The cloth originates beneath the housing.
cylinder('Motor spindle',(0,.08,3.735),.09,5.35,metal)
box('Curved-front cassette',(0,-.055,3.775),(5.57,.27,.235),metal,blind,.065)
for x in [-2.79,2.79]:box('Cassette end cap '+str(x),(x,-.055,3.775),(.035,.277,.243),frame,blind,.008)
box('Cassette brushed lower lip',(0,-.203,3.69),(5.44,.016,.023),bronze,blind,.004)

# Mesh top is z=0; scaling down deploys the blind without drifting the anchor.
verts=[];faces=[];nx=80;nz=60;width=5.28;drop=3.30
for j in range(nz+1):
    z=-drop*j/nz
    for i in range(nx+1):
        x=-width/2+width*i/nx
        y=.003*math.sin(x*9)+.0008*math.sin(z*21+x*4)
        verts.append((x,y,z))
for j in range(nz):
    for i in range(nx):
        a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
mesh=bpy.data.meshes.new('Continuous woven roller textile');mesh.from_pydata(verts,[],faces);mesh.materials.append(cloth);mesh.update()
fabric=bpy.data.objects.new('ANIM_Fabric_Deployment',mesh);scene.collection.objects.link(fabric);fabric.parent=blind;fabric.location=(0,-.065,3.635)
solid=fabric.modifiers.new('Actual blackout textile thickness','SOLIDIFY');solid.thickness=.004
rail=box('ANIM_Bottom_Rail',(0,-.075,3.55),(5.32,.072,.072),metal,blind,.024)
rail['note']='Linear path remains directly below the fabric; use full-width hero-bottom-rail.webp as a moving compositing layer.'
for f,fraction in [(1,.023),(145,1)]:
    fabric.scale.z=fraction;fabric.keyframe_insert(data_path='scale',frame=f,group='Roller deployment')
    rail.location.z=3.635-drop*fraction;rail.keyframe_insert(data_path='location',frame=f,group='Roller deployment')
for ob in (fabric,rail):
    for layer in ob.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for k in fc.keyframe_points:k.interpolation='LINEAR'

# A fully packed CC0 photographic landscape, gently graded for daylight reading.
pano=bpy.data.images.load(str(HERE/'sources'/'alps-field-panorama.jpg'));pano.pack()
sky=material('Alpine daylight · Poly Haven CC0','F1EDE3',1)
n=sky.node_tree.nodes;l=sky.node_tree.links;p=n.get('Principled BSDF')
im=n.new('ShaderNodeTexImage');im.image=pano
mix=n.new('ShaderNodeMixRGB');mix.blend_type='MIX';mix.inputs[0].default_value=.32;mix.inputs[2].default_value=(*rgb('EEE9DC'),1)
l.new(im.outputs['Color'],mix.inputs[1])
em=n.new('ShaderNodeEmission');em.inputs['Strength'].default_value=1.2
l.new(mix.outputs['Color'],em.inputs['Color']);l.new(em.outputs[0],n.get('Material Output').inputs['Surface'])
mesh=bpy.data.meshes.new('Landscape canvas');mesh.from_pydata([(-4,2,-.5),(4,2,-.5),(4,2,4.9),(-4,2,4.9)],[],[(0,1,2,3)]);mesh.update();uv=mesh.uv_layers.new()
for i,pair in enumerate([(.22,.37),(.84,.37),(.84,.93),(.22,.93)]):uv.data[i].uv=pair
o=bpy.data.objects.new('Soft alpine view',mesh);scene.collection.objects.link(o);o.parent=exterior;o.data.materials.append(sky)
o['license']='Alps Field · Andreas Mischok · Poly Haven · CC0 · https://polyhaven.com/a/alps_field'

def light(name,loc,energy,color,size,target):
    d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.color=color;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.parent=lighting;o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
light('Large warm daylight',(-3,-4,5),1800,(1,.9,.75),5,(0,0,2))
light('Soft frontal fill',(3,-4,2.5),400,(1,.94,.84),4,(0,0,2))
light('Sill reflected daylight',(0,1,4),550,(1,.95,.84),4,(0,0,.2))

def camera(name,scale):
    d=bpy.data.cameras.new(name);d.type='ORTHO';d.ortho_scale=scale;d.clip_end=50
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.parent=cameras;o.location=(0,-10,2.07);o.rotation_euler=(math.pi/2,0,0);return o
landscape=camera('CAM_Desktop_Front_1920x1200',6.40)
mobile=camera('CAM_Mobile_Front_1080x1440',4.10)
scene.camera=landscape;scene.render.resolution_x=1920;scene.render.resolution_y=1200

scene['render_engine_contract']='BLENDER_EEVEE only. 2 endpoints per layout, exact camera registration, PNG masters then WebP exports.'
scene['asset_contract']='Open and closed frames are intended for an inset clip-path reveal. The bottom rail is a separate transparent compositor sprite. See hero-geometry.json.'
text=bpy.data.texts.new('READ ME · HERO SCENE');text.write(__doc__+'\n'+root['README']+'\n6 seconds at 24 fps. Editable hierarchy: 01_Architecture, 02_Blind_Assembly, 03_Exterior, 04_Studio_Lighting, 05_Cameras. All materials and exterior image packed.\n')

geometry={}
for label,cam,w,h,xscale in [('desktop',landscape,1920,1200,1),('mobile',mobile,1080,1440,.55)]:
    scene.camera=cam;scene.render.resolution_x=w;scene.render.resolution_y=h
    for ob in (architecture,blind,details,exterior):ob.scale.x=xscale
    bpy.context.view_layer.update()
    def project(x,z):
        v=world_to_camera_view(scene,cam,Vector((x*xscale,-.065,z)))
        return [round(v.x,6),round(1-v.y,6)]
    geometry[label]={'width':w,'height':h,'apertureTopLeft':project(-2.64,3.635),'apertureBottomRight':project(2.64,.335),'openRailCenter':project(0,3.635-drop*.023)[1],'closedRailCenter':project(0,.335)[1]}
    for f,state in [(1,'open'),(145,'closed')]:
        scene.frame_set(f);scene.render.filepath=str(HERE/f'{label}-{state}.png');bpy.ops.render.render(write_still=True)
    # An isolated rail with true alpha; parent scales and same camera retained.
    scene.frame_set(73)
    saved=[]
    for ob in scene.objects:
        if ob.type=='MESH' and ob!=rail:
            saved.append(ob);ob.hide_render=True
    scene.render.film_transparent=True;scene.render.filepath=str(HERE/f'{label}-rail.png');bpy.ops.render.render(write_still=True)
    scene.render.film_transparent=False
    for ob in saved:ob.hide_render=False

for ob in (architecture,blind,details,exterior):ob.scale.x=1
scene.camera=landscape;scene.render.resolution_x=1920;scene.render.resolution_y=1200;scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');blind.select_set(True);bpy.context.view_layer.objects.active=blind
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'Hero-Umbral.blend'))
(OUT/'hero-geometry.json').write_text(json.dumps(geometry,indent=2),encoding='utf-8')
print('HERO_RENDER_COMPLETE',json.dumps(geometry))
