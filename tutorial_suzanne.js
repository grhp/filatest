const ibl_suffix = Filament.getSupportedFormatSuffix('foo');
const albedo_suffix = Filament.getSupportedFormatSuffix('foo');
const texture_suffix = Filament.getSupportedFormatSuffix('foo');
const env = 'syferfontein_18d_clear_2k'
const ibl_url = `${env}_ibl${ibl_suffix}.ktx`;
const sky_url = `${env}_skybox.ktx`;
const albedo_url = `albedo${albedo_suffix}.ktx`;
const ao_url = `ao${texture_suffix}.ktx`;
const metallic_url = `metallic${texture_suffix}.ktx`;
const normal_url = `normal${texture_suffix}.ktx`;
const roughness_url = `roughness${texture_suffix}.ktx`;
const filamat_url = 'textured.filamat';
const filamesh_url = 'suzanne.filamesh';
Filament.init([filamat_url, filamesh_url, sky_url], () => {
  window.VertexAttribute = Filament.VertexAttribute;
  window.AttributeType = Filament.VertexBuffer$AttributeType;
  window.PrimitiveType = Filament.RenderableManager$PrimitiveType;
  window.IndexType = Filament.IndexBuffer$IndexType;
  window.Fov = Filament.Camera$Fov;
  window.LightType = Filament.LightManager$Type;
  window.app = new App(document.getElementsByTagName('canvas')[0]);
});
class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.trackball = new Trackball(canvas, {
      startSpin: 0.035
    });
    const engine = this.engine = Filament.Engine.create(canvas);
    this.scene = engine.createScene();
    const sunlight = Filament.EntityManager.get()
      .create();
    Filament.LightManager.Builder(LightType.SUN)
      .color([0.98, 0.92, 0.89])
      .intensity(100000.0)
      .direction([0.6, -1.0, -0.8])
      .castShadows(true)
      .sunAngularRadius(1.9)
      .sunHaloSize(10.0)
      .sunHaloFalloff(80.0)
      .build(engine, sunlight);
    this.scene.addEntity(sunlight);
    const skybox = engine.createSkyFromKtx(sky_url);
    this.scene.setSkybox(skybox);
    const material = engine.createMaterial(filamat_url);
    const matinstance = material.createInstance();
    const sampler = new Filament.TextureSampler(Filament.MinFilter.LINEAR_MIPMAP_LINEAR, Filament.MagFilter.LINEAR, Filament.WrapMode.CLAMP_TO_EDGE);
    const mesh = engine.loadFilamesh(filamesh_url, matinstance);
    this.suzanne = mesh.renderable;
    Filament.fetch([ibl_url, albedo_url, roughness_url, metallic_url, normal_url, ao_url],
      () => {
        const indirectLight = engine.createIblFromKtx(ibl_url);
        indirectLight.setIntensity(100000);
        this.scene.setIndirectLight(indirectLight);
        const albedo = engine.createTextureFromKtx(albedo_url, {
          srgb: true
        });
        matinstance.setTextureParameter('albedo', albedo, sampler);
        const roughness = engine.createTextureFromKtx(roughness_url);
        matinstance.setTextureParameter('roughness', roughness, sampler);
        const metallic = engine.createTextureFromKtx(metallic_url);
        matinstance.setTextureParameter('metallic', metallic, sampler);
        const normal = engine.createTextureFromKtx(normal_url);
        matinstance.setTextureParameter('normal', normal, sampler);
        const ao = engine.createTextureFromKtx(ao_url);
        matinstance.setTextureParameter('ao', ao, sampler);
        this.scene.addEntity(this.suzanne);
      });
    this.swapChain = engine.createSwapChain();
    this.renderer = engine.createRenderer();
    this.camera = engine.createCamera();
    this.view = engine.createView();
    this.view.setCamera(this.camera);
    this.view.setScene(this.scene);
    this.resize();
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    window.requestAnimationFrame(this.render);
  }
  render() {
    const tcm = this.engine.getTransformManager();
    const inst = tcm.getInstance(this.suzanne);
    tcm.setTransform(inst, this.trackball.getMatrix());
    inst.delete();
    this.renderer.render(this.swapChain, this.view);
    window.requestAnimationFrame(this.render);
  }
  resize() {
    const dpr = window.devicePixelRatio;
    const width = this.canvas.width = window.innerWidth * dpr;
    const height = this.canvas.height = window.innerHeight * dpr;
    this.view.setViewport([0, 0, width, height]);
    const eye = [0, 0, 4],
      center = [0, 0, 0],
      up = [0, 1, 0];
    this.camera.lookAt(eye, center, up);
    const aspect = width / height;
    const fov = aspect < 1 ? Fov.HORIZONTAL : Fov.VERTICAL;
    this.camera.setProjectionFov(45, aspect, 1.0, 10.0, fov);
  }
}
