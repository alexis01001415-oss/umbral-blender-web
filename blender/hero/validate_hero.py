"""Read-only audit of the saved hero scene, independent of the original room.

blender --background --factory-startup --python blender/hero/validate_hero.py
Writes validation-report.json; never saves or mutates a Blender project on disk.
"""
from pathlib import Path
import bpy, json, hashlib, math
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE=Path(__file__).resolve().parent
FILE=HERE/'Hero-Umbral.blend'
OUT=HERE.parents[1]/'public'/'hero'
bpy.ops.wm.open_mainfile(filepath=str(FILE))
scene=bpy.context.scene
assert scene.render.engine=='BLENDER_EEVEE'
assert scene.render.fps==24 and (scene.frame_start,scene.frame_end)==(1,145)
root=bpy.data.objects['ROOT_Hero_Umbral']
assert root.type=='EMPTY'
groups=['01_Architecture','02_Blind_Assembly','03_Exterior','04_Studio_Lighting','05_Cameras','06_Architectural_Details']
for name in groups:
    ob=bpy.data.objects[name]
    assert ob.type=='EMPTY' and ob.parent==root, name
for ob in scene.objects:
    if ob.type in ('MESH','CAMERA','LIGHT'):
        assert ob.parent is not None, 'Unparented object: '+ob.name
        ancestor=ob
        while ancestor.parent:ancestor=ancestor.parent
        assert ancestor==root, 'Object outside root: '+ob.name
external_images=[im for im in bpy.data.images if im.source=='FILE' and im.users>0]
assert external_images and all(im.packed_file for im in external_images),'All image sources must be packed'
assert not bpy.data.libraries, 'No linked external Blender libraries allowed'

fabric=bpy.data.objects['ANIM_Fabric_Deployment'];rail=bpy.data.objects['ANIM_Bottom_Rail']
shader=fabric.data.materials[0].node_tree.nodes.get('Principled BSDF')
assert shader and shader.inputs['Alpha'].default_value==1
assert shader.inputs['Transmission Weight'].default_value==0
assert fabric.parent==rail.parent==bpy.data.objects['02_Blind_Assembly']
assert len(fabric.modifiers)>0 and any(mod.type=='SOLIDIFY' for mod in fabric.modifiers)
weave_coordinates=next(node for node in fabric.data.materials[0].node_tree.nodes if node.type=='TEX_COORD')
weave_space=bpy.data.objects['CONTROL_Fixed_Weave_Space']
assert weave_coordinates.object==weave_space and not weave_space.animation_data
assert weave_space.parent==fabric.parent,'Weave coordinate space must follow the complete blind assembly'

frames=[]
for frame in [1,37,73,109,145]:
    scene.frame_set(frame);bpy.context.view_layer.update()
    top=fabric.matrix_world@Vector((0,0,0))
    bottom=fabric.matrix_world@Vector((0,0,-3.30))
    r=rail.matrix_world.translation
    assert abs(top.z-3.635)<.00001,'The top edge must remain fixed'
    assert abs(bottom.z-r.z)<.00001,'The bottom rail must touch the fabric edge'
    frames.append({'frame':frame,'fabricScaleZ':round(fabric.scale.z,6),'topZ':round(top.z,6),'bottomZ':round(bottom.z,6),'railZ':round(r.z,6)})
assert all(a['bottomZ']>b['bottomZ'] for a,b in zip(frames,frames[1:]))
assert abs(frames[2]['fabricScaleZ']-(frames[0]['fabricScaleZ']+frames[-1]['fabricScaleZ'])/2)<.00001

metadata=json.loads((OUT/'hero-geometry.json').read_text())
for name,w,h,scale,cam in [('desktop',1920,1200,1,'CAM_Desktop_Front_1920x1200'),('mobile',1080,1440,.55,'CAM_Mobile_Front_1080x1440')]:
    scene.camera=bpy.data.objects[cam];scene.render.resolution_x=w;scene.render.resolution_y=h
    assert not scene.camera.animation_data, 'Hero camera must stay registered across endpoints'
    for group in ['01_Architecture','02_Blind_Assembly','03_Exterior','06_Architectural_Details']:bpy.data.objects[group].scale.x=scale
    bpy.context.view_layer.update()
    for f,key in [(1,'openRailCenter'),(145,'closedRailCenter')]:
        scene.frame_set(f);bpy.context.view_layer.update()
        projected=world_to_camera_view(scene,scene.camera,rail.matrix_world.translation)
        assert abs((1-projected.y)-metadata[name][key])<.000001, f'{name}/{key} differs from saved Blender geometry'

report={
    'blend':'Hero-Umbral.blend','sha256':hashlib.sha256(FILE.read_bytes()).hexdigest(),
    'engine':scene.render.engine,'fps':24,'durationSeconds':6,
    'groupNames':groups,'objects':len(scene.objects),'materials':len([m for m in bpy.data.materials if m.users]),
    'allFileImagesPacked':True,'linkedLibraries':0,'opaqueFabric':True,'staticCameras':True,'fixedWeaveSpace':True,
    'frames':frames,'projectionMatchesWebMetadata':True,
}
(HERE/'validation-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('HERO_AUDIT_PASSED',json.dumps(report))
