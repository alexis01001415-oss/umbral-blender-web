"""UMBRAL — reproducible, authored architectural product scene.
Run with Blender 5.x: blender --background --factory-startup --python blender/build_scene.py
All modeled geometry and material textures are original. The exterior uses the
CC0 Alps Field panorama by Andreas Mischok / Poly Haven, supplied in sources/.
"""
from pathlib import Path
import bpy, math, random, json
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public'
random.seed(21)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for block in bpy.data.materials: bpy.data.materials.remove(block)
scene = bpy.context.scene
scene.unit_settings.system='METRIC'
scene.render.fps=24
scene.frame_start=1
scene.frame_end=145

def group(name, parent=None, location=(0,0,0), rotation=(0,0,0)):
    obj=bpy.data.objects.new(name,None)
    scene.collection.objects.link(obj)
    obj.empty_display_type='PLAIN_AXES'; obj.empty_display_size=.25
    obj.parent=parent; obj.location=location; obj.rotation_euler=rotation
    return obj

root=group('ROOT_Umbral')
arch=group('GROUP_Architecture',root)
blind=group('GROUP_Blind',root,(-1.0,2.43,3.62))
chair=group('GROUP_Armchair',root,(1.32,.32,0),(0,0,math.radians(-13)))
lamp=group('GROUP_Lamp',root,(2.44,1.35,0))
table=group('GROUP_SideTable',root,(-.05,-.60,0))
rug=group('GROUP_Rug',root,(.86,-.1,0))
outside=group('GROUP_Exterior',root)
cameras=group('GROUP_Cameras',root)
lights=group('GROUP_Lighting',root)

def image_from_rgb(name,rgb,noncolor=False):
    rgb=np.clip(rgb,0,1).astype(np.float32)
    h,w,_=rgb.shape
    rgba=np.concatenate((rgb,np.ones((h,w,1),dtype=np.float32)),axis=2)
    im=bpy.data.images.new(name,width=w,height=h,alpha=False)
    if noncolor: im.colorspace_settings.name='Non-Color'
    im.pixels.foreach_set(rgba.ravel())
    im.filepath_raw=str(OUT/'textures'/f'{name}.png'); im.file_format='PNG'; im.save(); im.pack()
    return im

rng=np.random.default_rng(21)
# Real UV texture images survive glTF export; procedural shader nodes do not.
h,w=1024,512
y,x=np.mgrid[0:h,0:w].astype(np.float32)
yn=y/h; xn=x/w
warp=xn+.018*np.sin(yn*14)+.009*np.sin(yn*51+xn*12)
grain=.50+.15*np.sin(warp*460+np.sin(yn*10)*2)+.075*np.sin(warp*1310)
grain+=.12*np.sin(warp*44+np.sin(yn*8))+.065*rng.normal(size=(h,w))
knot=np.sqrt(((xn-.64)*2.3)**2+((yn-.67)*.65)**2)
grain+=.07*np.cos(knot*190)*np.exp(-knot*12)
wood_img=image_from_rgb('oak-smoked-grain',np.stack((.20+grain*.22,.12+grain*.16,.066+grain*.098),-1))
h=w=512; y,x=np.mgrid[0:h,0:w].astype(np.float32)
weave=.55+.14*np.sin(x*math.pi/2)+.11*np.sin(y*math.pi/2)+rng.normal(0,.09,(h,w))
fabric_img=image_from_rgb('linen-charcoal-weave',np.stack((.105+weave*.045,.116+weave*.043,.119+weave*.039),-1))
def normal_from_height(name,height,strength):
    dy,dx=np.gradient(height)
    normal=np.stack((-dx*strength,-dy*strength,np.ones_like(dx)),axis=-1)
    normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
    return image_from_rgb(name,normal*.5+.5,True)
fabric_normal=normal_from_height('linen-weave-normal',weave,.85)
wood_normal=normal_from_height('oak-grain-normal',grain,.50)
wall_noise=rng.normal(0,.012,(512,512))+np.sin(x*.19)*.003
wall_img=image_from_rgb('plaster-carbon-fine',np.stack((.095+wall_noise,.102+wall_noise,.103+wall_noise),-1))

def mat(name,color,rough=.5,metal=0,image=None,bump=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=rough
    bs.inputs['Metallic'].default_value=metal
    if image:
        tex=m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=image
        m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
        if bump:
            normal=m.node_tree.nodes.new('ShaderNodeNormalMap')
            normal.inputs['Strength'].default_value=.38 if image==wood_img else .33
            nt=m.node_tree.nodes.new('ShaderNodeTexImage');nt.image=wood_normal if image==wood_img else fabric_normal
            m.node_tree.links.new(nt.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
    m.diffuse_color=(*color,1)
    return m

carbon=mat('MAT_CarbonPlaster',(.10,.106,.11),.89,image=wall_img,bump=.004)
panel=mat('MAT_PaintedCharcoal',(.067,.076,.08),.55)
black=mat('MAT_AnodizedGraphite',(.018,.025,.029),.28,.76)
bronze=mat('MAT_BrushedBronze',(.34,.22,.105),.3,.83)
oak=mat('MAT_SmokedOak',(.32,.22,.14),.48,image=wood_img,bump=.0015)
linen=mat('MAT_CharcoalLinen',(.14,.15,.15),.94,image=fabric_img,bump=.003)
linen.node_tree.nodes.get('Principled BSDF').inputs['Sheen Weight'].default_value=.22
blindmat=mat('MAT_BlackoutWoven',(.038,.047,.05),.98,image=fabric_img,bump=.001)
blindmat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.024,.029,.03,1)
# Tint baked texture instead of relying on unsupported procedural shaders.
blindtex=image_from_rgb('blackout-fabric',np.stack((.049+weave*.016,.060+weave*.015,.064+weave*.015),-1))
next(n for n in blindmat.node_tree.nodes if n.type=='TEX_IMAGE').image=blindtex
seammat=mat('MAT_StitchedPiping',(.19,.205,.20),.96)
leather=mat('MAT_TaupeCushion',(.28,.24,.18),.93)
wool=mat('MAT_NaturalWool',(.33,.30,.24),.96)
ceramic=mat('MAT_StoneCeramic',(.39,.36,.31),.68)
paper=mat('MAT_IvoryPaper',(.62,.57,.46),.88)
pages=mat('MAT_BookPages',(.48,.455,.39),.99)

def emissive(name,color,strength):
    m=mat(name,color,.75)
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Emission Color'].default_value=(*color,1); bs.inputs['Emission Strength'].default_value=strength
    return m

bulbmat=emissive('MAT_WarmDiffuser',(1,.69,.31),2.6)

def uv_box(mesh, dims):
    # Each rectangular face receives a full clean image, with long grain along Y/Z.
    for poly in mesh.polygons:
        n=poly.normal
        axes=(0,1) if abs(n.z)>.5 else ((0,2) if abs(n.y)>.5 else (1,2))
        for li in poly.loop_indices:
            co=mesh.vertices[mesh.loops[li].vertex_index].co
            mesh.uv_layers.active.data[li].uv=(co[axes[0]]/dims[axes[0]]+.5,co[axes[1]]/dims[axes[1]]+.5)

def box(name,location,size,material,parent=None,bevel=.015,segments=3,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o=bpy.context.object; o.name=name
    o.dimensions=size; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    uv_box(o.data,size)
    o.parent=parent; o.location=location; o.rotation_euler=rot
    if material:o.data.materials.append(material)
    if bevel:
        mod=o.modifiers.new('Soft manufactured edges','BEVEL'); mod.width=bevel; mod.segments=segments
        bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
        for p in o.data.polygons:p.use_smooth=True
        mod=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL'); mod.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def cylinder(name,loc,radius,depth,material,parent,vertices=48,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth)
    o=bpy.context.object; o.name=name;o.parent=parent;o.location=loc;o.rotation_euler=rot
    if material:o.data.materials.append(material)
    mod=o.modifiers.new('Precision rim','BEVEL');mod.width=.006;mod.segments=2
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in o.data.polygons:p.use_smooth=True
    mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def line(name,coords,radius,material,parent,closed=False):
    cr=bpy.data.curves.new(name,'CURVE');cr.dimensions='3D';cr.resolution_u=2;cr.bevel_depth=radius;cr.bevel_resolution=2
    spl=cr.splines.new('POLY');spl.points.add(len(coords)-1)
    for p,co in zip(spl.points,coords):p.co=(*co,1)
    spl.use_cyclic_u=closed
    ob=bpy.data.objects.new(name,cr);scene.collection.objects.link(ob);ob.parent=parent;ob.data.materials.append(material)
    bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH');ob.select_set(False)
    return ob

def rounded_outline(cx,cy,z,width,depth,r=.07,n=7):
    coords=[]
    for x,y,theta in [(cx+width/2-r,cy+depth/2-r,0),(cx-width/2+r,cy+depth/2-r,90),(cx-width/2+r,cy-depth/2+r,180),(cx+width/2-r,cy-depth/2+r,270)]:
        for a in np.linspace(theta,theta+90,n):coords.append((x+r*math.cos(math.radians(a)),y+r*math.sin(math.radians(a)),z))
    return coords

# Architecture: a physically open window, timber reveals, subtly jointed wall panels.
box('Floor_Substrate',(-1,-4.22,-.10),(24,14.0,.16),oak,arch)
for i in range(35):
    x=-5.55+i*.267
    for j in range(-1,7):
        y=-5.2+j*1.35+(i%3)*.45
        lo=max(y,-5.2);hi=min(y+1.34,2.78)
        if hi>lo:
            o=box(f'Oak_Plank_{i:02}_{j:02}',(x,(lo+hi)/2,-.015),(.258,hi-lo,.035),oak,arch,.003,2)
            # Differing UV sample orientation avoids identical neighboring planks.
            offset=random.random()
            for uv in o.data.uv_layers.active.data:uv.uv.y+=offset
box('Wall_Left_WindowPier',(-7.215,2.75,4.0),(9.57,.24,8.0),carbon,arch)
box('Wall_Right_WindowPier',(6.385,2.75,4.0),(12.03,.24,8.0),carbon,arch)
box('Wall_WindowHeader',(-1.03,2.75,5.86),(2.81,.24,4.40),panel,arch)
box('Wall_WindowApron',(-1.03,2.75,.14),(2.81,.24,.28),panel,arch)
box('Wall_Return_Right',(3.56,-.2,4.0),(.18,6.15,8.0),carbon,arch)
box('Crown_Back',(-1,2.52,7.97),(24,.28,.10),black,arch)
box('Skirting_Back',(-1,2.53,.14),(9.2,.09,.28),panel,arch)
box('Skirting_Right',(3.42,.82,.14),(.09,3.55,.28),panel,arch)
for x in [-5.26,-4.65,-4.04,-3.43,-2.78,.74,1.35,1.96,2.57,3.18]:
    box('Panel_ShadowGap',(x,2.605,4.12),(.014,.019,7.66),black,arch,.002,1)
    box('Panel_EdgeHighlight',(x+.013,2.591,4.12),(.006,.011,7.66),panel,arch,.001,1)
# Window inner opening X -2.50..0.50, Z .35..3.62.
for x in [-2.57,.57]:
    box('Window_Jamb',(x,2.49,1.99),(.14,.34,3.48),black,arch,.018)
    box('Window_Reveal_Accent',(x+(.09 if x<0 else -.09),2.61,1.99),(.018,.14,3.38),bronze,arch,.004)
for z in [.30,3.68]:box('Window_HorizontalFrame',(-1,2.49,z),(3.28,.34,.14),black,arch,.018)
box('Window_Sill_Oak',(-1,2.35,.28),(3.38,.53,.08),oak,arch,.012)
# Glass is deliberately omitted: clear glass adds reflections in Cycles but obscures
# the interactive vista on mobile and can cause glTF transmission sorting artifacts.

# Roller assembly: all animated coordinates are local to GROUP_Blind.
box('Blind_Cassette', (0,.045,.035),(3.07,.22,.18),black,blind,.055,6)
roller_axis=group('Blind_RollerAxis',blind,(0,-.025,-.015),(0,math.pi/2,0))
roller=cylinder('BLIND_Roller',(0,0,0),.074,2.98,black,roller_axis,64)
for x in [-1.5,1.5]:box('Blind_EndBracket',(x,.012,-.02),(.056,.24,.26),black,blind,.028,4)
for x in [-1.53,1.53]:box('Blind_SideChannel',(x,0,-1.63),(.03,.058,3.25),black,blind,.004)
# Fine grid; its top edge is the origin and stays fixed as length changes.
verts=[];faces=[];nx=32;nz=32;full_length=3.225
for j in range(nz+1):
    for i in range(nx+1):
        x=-1.475+2.95*i/nx;z=-full_length*j/nz
        wave=(math.sin(i/nx*math.pi*6)*.0012+math.sin(i/nx*math.pi*2)*.0015)*math.sin(j/nz*math.pi)
        verts.append((x,-.104+wave,z))
for j in range(nz):
    for i in range(nx):
        a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
me=bpy.data.meshes.new('Blackout precision textile mesh');me.from_pydata(verts,[],faces);me.update()
fabric=bpy.data.objects.new('BLIND_Fabric',me);scene.collection.objects.link(fabric);fabric.parent=blind;me.materials.append(blindmat)
uv=me.uv_layers.new(name='Textile UV')
for p in me.polygons:
    for li in p.loop_indices:
        co=me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=((co.x+1.475)*3,-co.z*3)
sol=fabric.modifiers.new('Real fabric thickness 1mm','SOLIDIFY');sol.thickness=.001
bpy.context.view_layer.objects.active=fabric;bpy.ops.object.modifier_apply(modifier=sol.name)
rail=box('BLIND_BottomRail',(0,-.105,-.16),(2.98,.044,.049),black,blind,.014,4)
for x in [-1.49,1.49]:box('Rail_EndCap',(x,0,0),(.016,.052,.052),black,rail,.008)
# Small authentic pull-chain loop, grouped separately so the motorized rail remains clean.
chain=[]
for a in np.linspace(0,2*math.pi,90):chain.append((1.56+math.sin(a)*.018,-.028,-.34+.29*math.cos(a)))
line('Control_Chain',chain,.0024,bronze,blind,True)
for i in range(28):
    a=2*math.pi*i/28
    bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=4,radius=.005)
    o=bpy.context.object;o.name=f'Chain_Bead_{i:02}';o.parent=blind;o.location=(1.56+math.sin(a)*.018,-.028,-.34+.29*math.cos(a));o.data.materials.append(bronze)

# Contemporary armchair: separately editable upholstered parts and stitched welts.
for x in [-.65,.65]:
    for y in [-.57,.55]:
        cylinder('Chair_BronzeFoot',(x,y,.18),.022,.36,bronze,chair,24)
        cylinder('Chair_FootPad',(x,y,.022),.035,.018,black,chair,24)
box('Chair_LowerFrame',(0,0,.42),(1.56,1.44,.28),linen,chair,.11,7)
box('Chair_SeatCushion',(0,-.13,.64),(1.18,1.10,.24),linen,chair,.115,8)
back=box('Chair_BackCushion',(0,.53,1.07),(1.22,.32,.93),linen,chair,.145,8,(math.radians(8),0,0))
for x in [-.68,.68]:
    box('Chair_Arm',(x,.035,.88),(.32,1.48,.79),linen,chair,.14,8)
    line('Chair_Arm_Piping',rounded_outline(x,.035,1.25,.205,1.35,.075),.0045,seammat,chair,True)
line('Chair_Seat_Piping',rounded_outline(0,-.13,.737,1.09,1.01,.11),.0045,seammat,chair,True)
line('Chair_Base_Piping',rounded_outline(0,0,.50,1.48,1.37,.12),.004,seammat,chair,True)
pillow=box('Chair_LumbarPillow',(.15,.30,1.08),(.70,.24,.59),leather,chair,.12,10,(math.radians(12),math.radians(-7),math.radians(-12)))
# Woven throw draped naturally from seat to front; explicit geometry exports as-is.
coords=[];faces=[];uN=18;vN=38
for j in range(vN+1):
    t=j/vN
    yy=.30-1.30*t
    zz=.79 if t<.79 else .79-.53*((t-.79)/.21)**.70
    for i in range(uN+1):
        u=i/uN
        coords.append((-.28+.43*u,yy,zz+math.sin(u*math.pi*8+t*.7)*.012+(math.sin(t*21+u)*.004)))
for j in range(vN):
    for i in range(uN):
        a=j*(uN+1)+i;faces.append((a,a+1,a+uN+2,a+uN+1))
me=bpy.data.meshes.new('Woven throw drape');me.from_pydata(coords,[],faces);me.update()
throw=bpy.data.objects.new('Chair_DrapedThrow',me);scene.collection.objects.link(throw);throw.parent=chair;me.materials.append(wool)
for p in me.polygons:p.use_smooth=True
sol=throw.modifiers.new('Cloth thickness','SOLIDIFY');sol.thickness=.005
bpy.context.view_layer.objects.active=throw;bpy.ops.object.modifier_apply(modifier=sol.name)

# Rug, a restrained warm neutral counterpoint to charcoal upholstery.
box('Rug_WovenBody',(0,0,.018),(3.0,2.48,.036),wool,rug,.055,5)
line('Rug_BoundEdge',rounded_outline(0,0,.038,2.94,2.42,.06),.010,leather,rug,True)
for j in range(67):
    x=-1.42+j*.043
    for side in [-1,1]:line('Rug_Fringing',[(x,side*1.23,.023),(x+.008,side*1.29,.024),(x-.004,side*1.32,.015)],.0025,wool,rug)

# Slim tripod reading lamp, dark exterior and glowing linen diffuser.
cylinder('Lamp_Base',(0,0,.05),.29,.07,black,lamp,64)
for a in [30,150,270]:
    ar=math.radians(a)
    line('Lamp_SlenderLeg',[(math.cos(ar)*.23,math.sin(ar)*.23,.075),(math.cos(ar)*.15,math.sin(ar)*.15,2.22)],.008,bronze,lamp)
cylinder('Lamp_Collar',(0,0,2.14),.13,.035,bronze,lamp,48)
# Open lampshade shell (no black cap across either opening).
verts=[];faces=[];segments=80
for z,r in [(2.08,.49),(2.65,.455),(2.08,.478),(2.65,.443)]:
    for i in range(segments):
        a=i/segments*math.tau;verts.append((math.cos(a)*r,math.sin(a)*r,z))
for i in range(segments):
    k=(i+1)%segments
    faces.extend([(i,k,segments+k,segments+i),(2*segments+i,3*segments+i,3*segments+k,2*segments+k),(i,2*segments+i,2*segments+k,k),(segments+i,segments+k,3*segments+k,3*segments+i)])
me=bpy.data.meshes.new('Lamp linen shell');me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new('Lamp_Shade',me);scene.collection.objects.link(ob);ob.parent=lamp;me.materials.append(linen)
for p in me.polygons:p.use_smooth=True
cylinder('Lamp_Diffuser',(0,0,2.107),.473,.007,bulbmat,lamp,80)
for z,r in [(2.08,.489),(2.65,.454)]:
    line('Lamp_ShadeRim',[(r*math.cos(a),r*math.sin(a),z) for a in np.linspace(0,math.tau,80,endpoint=False)],.0055,bronze,lamp,True)

# Sculptural compact side table with ceramic and a closed design monograph.
cylinder('Table_Pedestal',(0,0,.255),.17,.50,black,table,64)
cylinder('Table_Foot',(0,0,.038),.29,.034,black,table,64)
cylinder('Table_OakTop',(0,0,.527),.43,.055,oak,table,80)
book=group('Table_Book',table,(.025,.02,.572),(0,0,.18))
box('Book_Cover',(0,0,0),(.32,.23,.038),panel,book,.006)
box('Book_PageBlock',(0,-.003,.001),(.302,.218,.025),pages,book,.002)
box('Book_TopCover',(0,0,.021),(.324,.234,.004),paper,book,.002)
cylinder('Cup_Body',(-.19,-.10,.611),.060,.13,ceramic,table,40)
coffee=mat('MAT_Espresso',(.035,.016,.009),.2)
cylinder('Cup_Espresso',(-.19,-.10,.678),.047,.002,coffee,table,40)
line('Cup_Handle',[(-.25-.04*math.sin(a),-.10,.619+.038*math.cos(a)) for a in np.linspace(0,math.pi,22)],.010,ceramic,table)

# A CC0 photographic panorama replaces the development landscape proxy.
# This is a color-managed texture conversion for the glTF PBR pipeline.
for ob in list(outside.children_recursive):bpy.data.objects.remove(ob,do_unlink=True)
source=ROOT/'blender'/'sources'/'alps_field_2k.hdr'
if not source.exists():
    import urllib.request
    source.parent.mkdir(parents=True,exist_ok=True)
    urllib.request.urlretrieve('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/alps_field_2k.hdr',source)
hdr=bpy.data.images.load(str(source))
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=92
hdr.save_render(str(OUT/'textures'/'alps-field-panorama.jpg'),scene=scene)
panorama=bpy.data.images.load(str(OUT/'textures'/'alps-field-panorama.jpg'));panorama.pack()
panomat=emissive('MAT_ExteriorPanorama',(1,1,1),.85)
panobs=panomat.node_tree.nodes.get('Principled BSDF')
panotex=panomat.node_tree.nodes.new('ShaderNodeTexImage');panotex.image=panorama
panomat.node_tree.links.new(panotex.outputs['Color'],panobs.inputs['Base Color'])
panomat.node_tree.links.new(panotex.outputs['Color'],panobs.inputs['Emission Color'])
bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=48,radius=60)
dome=bpy.context.object;dome.name='Landscape_Panorama';dome.parent=outside;dome.location=(0,0,-13);dome.rotation_euler.z=math.radians(105);dome.data.materials.append(panomat)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.flip_normals();bpy.ops.object.mode_set(mode='OBJECT')
for p in dome.data.polygons:p.use_smooth=True
dome.visible_shadow=False
dome.visible_diffuse=False
dome['source']='Alps Field / Andreas Mischok / Poly Haven / CC0 / https://polyhaven.com/a/alps_field'
bpy.data.images.remove(hdr)

def light(name,kind,loc,energy,color,size=1,target=None,parent=lights):
    data=bpy.data.lights.new(name,kind);data.energy=energy;data.color=color
    if kind=='AREA':data.shape='DISK';data.size=size
    if kind=='POINT':data.shadow_soft_size=size
    ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.parent=parent;ob.location=loc
    if target:ob.rotation_euler=(Vector(target)-Vector(loc)).to_track_quat('-Z','Y').to_euler()
    return ob

light('LIGHT_WindowSoftbox','AREA',(-1.2,4.5,3.7),780,(.72,.84,1),3.0,target=(-.6,-1,.3))
light('LIGHT_InteriorBounce','AREA',(0,-3.2,3.9),180,(.82,.86,1),4.0,target=(0,1,1))
light('LIGHT_WarmFill','AREA',(3.1,-.2,3.8),100,(1,.66,.36),2.0,target=(.5,.5,.9))
light('LIGHT_LampGlow','POINT',(2.44,1.35,2.02),45,(1,.61,.26),.18)
light('LIGHT_LampUplight','AREA',(2.44,1.35,2.63),22,(1,.68,.33),.42,target=(2.44,1.35,4))
sun=light('LIGHT_AfternoonSun','SUN',(-3,8,8),2.2,(1,.83,.61),target=(1,-2,0));sun.data.angle=math.radians(6)
world=bpy.data.worlds.new('World_SoftOvercast');scene.world=world;world.use_nodes=True;world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.35,.43,.51,1);world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.26

def camera(name,loc,target,lens):
    data=bpy.data.cameras.new(name);data.lens=lens;data.sensor_width=36;data.clip_end=200
    ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.parent=cameras;ob.location=loc;ob.rotation_euler=(Vector(target)-Vector(loc)).to_track_quat('-Z','Y').to_euler();return ob
cam=camera('CAMERA_Hero',(2.4,-7.3,2.62),(-.20,1.40,1.90),56)
scene.camera=cam
camera('CAMERA_Detail',(1.5,-2.2,2.8),(-.7,2.4,2.9),54)
camera('CAMERA_Front',(.20,-7.8,2.2),(-.1,1.1,1.9),42)

def stash(obj,clip):
    action=obj.animation_data.action
    action.name=f'{clip}__{obj.name}'
    track=obj.animation_data.nla_tracks.new();track.name=clip
    strip=track.strips.new(action.name,1,action);strip.name=clip
    obj.animation_data.action=None

for frame,t in [(1,0),(17,.035),(129,.965),(145,1)]:
    length=.15+(full_length-.15)*t
    fabric.scale=(1,1,length/full_length);fabric.keyframe_insert(data_path='scale',frame=frame,group='Motorized blackout')
    rail.location.z=-length;rail.keyframe_insert(data_path='location',frame=frame,group='Motorized blackout')
    roller.rotation_euler.z=t*math.tau*6;roller.keyframe_insert(data_path='rotation_euler',frame=frame,group='Motorized blackout')
for ob in [fabric,rail,roller]:stash(ob,'Blind_Close')
for frame,loc,target in [(1,(2.4,-7.3,2.62),(-.20,1.40,1.90)),(73,(2.1,-7.05,2.57),(-.25,1.50,1.91)),(145,(1.8,-6.8,2.52),(-.30,1.60,1.92))]:
    cam.location=loc;cam.rotation_euler=(Vector(target)-Vector(loc)).to_track_quat('-Z','Y').to_euler();cam.keyframe_insert(data_path='location',frame=frame);cam.keyframe_insert(data_path='rotation_euler',frame=frame)
stash(cam,'Camera_Travel')
scene.timeline_markers.new('OPEN · 0%',frame=1);scene.timeline_markers.new('HALF · 50%',frame=73);scene.timeline_markers.new('CLOSED · 100%',frame=145)
root['project']='UMBRAL / Architectural light study';root['authoring']='Original meshes and UV textures created for this project';root['units']='meters';blind['operation']='Scrub Blind_Close: time 0 = open, time 6 = closed';blind['travel_m']=full_length-.15

# Save editable project with helpful collections and camera view.
for g in [arch,blind,chair,lamp,table,rug,outside,cameras,lights]:
    coll=bpy.data.collections.new(g.name.replace('GROUP_',''));scene.collection.children.link(coll)
    descendants=[g]+list(g.children_recursive)
    for ob in descendants:
        for existing in list(ob.users_collection):existing.objects.unlink(ob)
        coll.objects.link(ob)
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='OPTIX';prefs.get_devices()
    gpu_devices=[d for d in prefs.devices if d.type=='OPTIX']
    if gpu_devices:
        for device in prefs.devices:device.use=device.type=='OPTIX'
        scene.cycles.device='GPU'
    else:
        scene.render.threads_mode='FIXED';scene.render.threads=4
except Exception:
    scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=1500;scene.render.resolution_y=1300;scene.render.resolution_percentage=70
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
scene.frame_set(1)
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/'Umbral.blend'))
# Batch static meshes by material inside each primary group for the web. The
# saved .blend retains every editable object; reload it after the web export.
for asset_group in [arch,chair,lamp,table,rug,blind]:
    batches={}
    for ob in list(asset_group.children_recursive):
        if ob.type=='MESH' and not ob.animation_data and len(ob.data.materials)==1:
            key=(ob.parent.name if ob.parent else '',ob.data.materials[0].name)
            batches.setdefault(key,[]).append(ob)
    for (parent_name,material_name),objects in batches.items():
        if len(objects)<2:continue
        bpy.ops.object.select_all(action='DESELECT')
        for ob in objects:ob.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        bpy.context.object.name=parent_name.replace('GROUP_','STATIC_')+'_'+material_name.replace('MAT_','')
# Lighting is recreated in Three.js, which has different physically based exposure.
# Exporting Blender area lights would silently drop them; omit all lights consistently.
bpy.ops.export_scene.gltf(filepath=str(OUT/'models'/'umbral-room.glb'),export_format='GLB',export_yup=True,export_apply=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_merge_animation='NLA_TRACK',export_force_sampling=True,export_frame_range=True,export_frame_step=1,export_cameras=True,export_lights=False,export_extras=True,export_materials='EXPORT')
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'blender'/'Umbral.blend'))
scene=bpy.context.scene;fabric=bpy.data.objects['BLIND_Fabric'];blindmat=bpy.data.materials['MAT_BlackoutWoven']
# Blender's fabric UVs follow deployed length too. Dynamic Mapping inputs are not
# part of core glTF animation, so Three.js mirrors this with Texture.repeat.y.
mapping=blindmat.node_tree.nodes.new('ShaderNodeMapping');mapping.name='Deployment compensation — constant texel density'
uvcoords=blindmat.node_tree.nodes.new('ShaderNodeTexCoord')
blindmat.node_tree.links.new(uvcoords.outputs['UV'],mapping.inputs['Vector'])
for texnode in [n for n in blindmat.node_tree.nodes if n.type=='TEX_IMAGE']:
    blindmat.node_tree.links.new(mapping.outputs['Vector'],texnode.inputs['Vector'])
driver=mapping.inputs['Scale'].driver_add('default_value',1).driver
driver.type='SCRIPTED';driver.expression='deployed'
variable=driver.variables.new();variable.name='deployed';variable.type='TRANSFORMS'
variable.targets[0].id=fabric;variable.targets[0].transform_type='SCALE_Z';variable.targets[0].transform_space='LOCAL_SPACE'
scene.frame_set(67)
scene.render.filepath=str(OUT/'poster.png')
bpy.ops.render.render(write_still=True)
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=92
bpy.data.images['Render Result'].save_render(str(OUT/'poster.jpg'),scene=scene)
scene.render.image_settings.file_format='PNG'
scene.frame_set(1)
scene.render.resolution_percentage=100
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/'Umbral.blend'))
print('UMBRAL_BUILD_COMPLETE')
