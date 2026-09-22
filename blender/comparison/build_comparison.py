"""Independent Eevee day/night Duo comparison. Reads the hero; saves only here.
The same frontal camera, shade deployment and aligned zebra layers are used in
both frames. Only interior lighting and exterior illumination change.
"""
from pathlib import Path
import bpy, json, hashlib
from mathutils import Vector

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
OUT=ROOT/'public'/'comparison'
HERE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
source=ROOT/'blender'/'hero'/'Hero-Umbral.blend'
source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=768;scene.render.resolution_y=864;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
scene.view_settings.exposure=.3
scene.frame_set(145)
scene.camera=bpy.data.objects['CAM_Mobile_Front_1080x1440']
scene.camera.name='CAM_Duo_Registered_Day_Night';scene.camera.data.ortho_scale=4.35;scene.camera.location.z=2.05
for name in ['01_Architecture','02_Blind_Assembly','03_Exterior','06_Architectural_Details']:bpy.data.objects[name].scale.x=.65
root=bpy.data.objects['ROOT_Hero_Umbral'];root.name='ROOT_Duo_Day_Night'
root['README']='Independent lighting comparison. Same camera and curtain pose in both renders. DAY/NIGHT lighting states are stored at frames 1 and 2. Original hero and room files are never modified.'

# Zebra shades use two aligned fabric layers. The sheer bands reveal the view;
# opaque bands remain identically positioned in day and night renders.
fabric=bpy.data.objects['ANIM_Fabric_Deployment'];fabric.animation_data_clear();fabric.name='DUO_Front_Fabric'
rail=bpy.data.objects['ANIM_Bottom_Rail'];rail.animation_data_clear();rail.name='DUO_Bottom_Rail'
cloth=fabric.data.materials[0];cloth.name='DUO_Espresso_Opaque_And_Sheer'
cloth.surface_render_method='DITHERED'
nodes=cloth.node_tree.nodes;links=cloth.node_tree.links
shader=nodes.get('Principled BSDF');shader.inputs['Sheen Weight'].default_value=.04
wave=next(n for n in nodes if n.type=='TEX_WAVE');wave.inputs['Scale'].default_value=.53
opacity=nodes.new('ShaderNodeValToRGB');opacity.name='Duo alternating opaque and sheer bands'
opacity.color_ramp.elements[0].position=.46;opacity.color_ramp.elements[0].color=(.08,.08,.08,1)
opacity.color_ramp.elements[1].position=.51;opacity.color_ramp.elements[1].color=(1,1,1,1)
links.new(wave.outputs['Color'],opacity.inputs['Fac']);links.new(opacity.outputs['Color'],shader.inputs['Alpha'])
rear=fabric.copy();rear.data=fabric.data.copy();rear.name='DUO_Rear_Fabric';scene.collection.objects.link(rear);rear.location.y+=.025
rear['note']='Second aligned fabric layer creates the characteristic double roller day/night fabric.'
fabric['note']='Current pose deliberately identical for both lighting states; transparency differences come from illumination.'

# Give the sheath a darker satin espresso finish than the bright metal hero.
cassette=bpy.data.materials.get('Cassette · 261405')
if cassette:
    p=cassette.node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=.24;p.inputs['Roughness'].default_value=.52

sky=bpy.data.materials['Alpine daylight · Poly Haven CC0']
mix=next(n for n in sky.node_tree.nodes if n.type=='MIX_RGB')
em=next(n for n in sky.node_tree.nodes if n.type=='EMISSION')
world=scene.world.node_tree.nodes.get('Background')
lights={name:bpy.data.objects[name].data for name in ['Large warm daylight','Soft frontal fill','Sill reflected daylight']}

states={
    'day':dict(frame=1,sky_mix=.04,sky_color=(.74,.7,.62,1),emission=1.35,world=.45,
        lights=[(1300,(1,.91,.78)),(360,(1,.94,.87)),(550,(1,.95,.84))]),
    'night':dict(frame=2,sky_mix=.70,sky_color=(.004,.01,.026,1),emission=.19,world=.028,
        lights=[(330,(1,.46,.16)),(55,(.40,.54,1)),(70,(1,.48,.20))]),
}
for label,state in states.items():
    scene.frame_set(state['frame'])
    mix.inputs[0].default_value=state['sky_mix'];mix.inputs[2].default_value=state['sky_color'];em.inputs['Strength'].default_value=state['emission'];world.inputs['Strength'].default_value=state['world']
    for input in [mix.inputs[0],mix.inputs[2],em.inputs['Strength'],world.inputs['Strength']]:input.keyframe_insert('default_value',frame=state['frame'])
    for light,(energy,color) in zip(lights.values(),state['lights']):
        light.energy=energy;light.color=color;light.keyframe_insert('energy',frame=state['frame']);light.keyframe_insert('color',frame=state['frame'])
    scene.render.filepath=str(HERE/f'duo-{label}.png');bpy.ops.render.render(write_still=True)
scene.frame_start=1;scene.frame_end=2;scene.frame_set(1)
scene['comparison']='DAY=frame1; NIGHT=frame2. No shade or camera motion between states. The slider compares lighting, not blackout performance or a guarantee of nighttime privacy.'
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'Duo-Day-Night.blend'))
assert hashlib.sha256(source.read_bytes()).hexdigest()==source_hash,'Original hero must stay untouched'
(HERE/'comparison-contract.json').write_text(json.dumps({'width':768,'height':864,'dayFrame':1,'nightFrame':2,'sameCamera':True,'sameFabricPose':True,'fabricScaleZ':fabric.scale.z,'sourceHeroUntouched':True},indent=2))
print('DUO_COMPARISON_RENDERED')
