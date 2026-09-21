"""Export a lightweight web GLB from the editable Umbral.blend without saving it."""
from pathlib import Path
import bpy
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'blender'/'Umbral.blend'))
bpy.context.scene.frame_set(1)
material=bpy.data.materials['MAT_BlackoutWoven']
for node in material.node_tree.nodes:
    if node.type=='TEX_IMAGE':
        for link in list(node.inputs['Vector'].links):material.node_tree.links.remove(link)
before=len([o for o in bpy.context.scene.objects if o.type=='MESH'])
for group_name in ['GROUP_Architecture','GROUP_Armchair','GROUP_Lamp','GROUP_SideTable','GROUP_Rug','GROUP_Blind']:
    group=bpy.data.objects[group_name]
    batches={}
    for ob in list(group.children_recursive):
        if ob.type=='MESH' and not ob.animation_data and len(ob.data.materials)==1:
            key=(ob.parent.name if ob.parent else '',ob.data.materials[0].name)
            batches.setdefault(key,[]).append(ob)
    for (parent_name,mat_name),objects in batches.items():
        if len(objects)<2:continue
        bpy.ops.object.select_all(action='DESELECT')
        for ob in objects:ob.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        bpy.context.object.name=parent_name.replace('GROUP_','STATIC_')+'_'+mat_name.replace('MAT_','')
bpy.ops.export_scene.gltf(filepath=str(root/'public'/'models'/'umbral-room.glb'),export_format='GLB',export_yup=True,export_apply=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_merge_animation='NLA_TRACK',export_force_sampling=True,export_frame_range=True,export_frame_step=1,export_cameras=True,export_lights=False,export_extras=True,export_materials='EXPORT')
after=len([o for o in bpy.context.scene.objects if o.type=='MESH'])
print(f'UMBRAL_OPTIMIZED: {before} meshes -> {after} meshes; editable .blend unchanged')
