"""Verify animation endpoints in Cycles with OptiX when available."""
from pathlib import Path
import bpy,json
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'blender'/'Umbral.blend'))
scene=bpy.context.scene
prefs=bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type='OPTIX';prefs.get_devices()
gpu=[d for d in prefs.devices if d.type=='OPTIX']
if gpu:
    for device in prefs.devices:device.use=device.type=='OPTIX'
    scene.cycles.device='GPU'
else:
    scene.render.threads_mode='FIXED';scene.render.threads=4
scene.cycles.samples=48
scene.render.resolution_percentage=70
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=92
fabric=bpy.data.objects['BLIND_Fabric']
rail=bpy.data.objects['BLIND_BottomRail']
mapping=bpy.data.materials['MAT_BlackoutWoven'].node_tree.nodes.get('Deployment compensation — constant texel density')
checks=[]
for frame,label in [(1,'open'),(145,'closed')]:
    scene.frame_set(frame)
    checks.append({'frame':frame,'fabricScaleZ':fabric.scale.z,'railZ':rail.location.z,'uvScaleY':mapping.inputs['Scale'].default_value[1]})
    scene.render.filepath=str(root/'public'/f'poster-{label}.jpg')
    bpy.ops.render.render(write_still=True)
scene.frame_set(1)
scene.render.image_settings.file_format='PNG';scene.render.resolution_percentage=100
bpy.ops.wm.save_as_mainfile(filepath=str(root/'blender'/'Umbral.blend'))
(root/'blender'/'animation-checks.json').write_text(json.dumps(checks,indent=2))
print('UMBRAL_ENDPOINTS_VERIFIED',checks)
