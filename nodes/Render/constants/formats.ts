/**
 * Supported file formats for Render Network
 * Scene files, output formats, and AI model formats
 */

// Supported 3D scene file formats
export const SCENE_FORMATS = {
	// Native OctaneRender formats
	orbx: {
		extension: '.orbx',
		name: 'OctaneRender Package',
		description: 'Native OctaneRender scene package',
		maxSize: 10737418240, // 10 GB
		supported: true,
	},
	ocs: {
		extension: '.ocs',
		name: 'OctaneRender Scene',
		description: 'OctaneRender scene file',
		maxSize: 5368709120, // 5 GB
		supported: true,
	},

	// Standard 3D formats
	blend: {
		extension: '.blend',
		name: 'Blender',
		description: 'Blender native format',
		maxSize: 5368709120,
		supported: true,
	},
	c4d: {
		extension: '.c4d',
		name: 'Cinema 4D',
		description: 'Cinema 4D project file',
		maxSize: 5368709120,
		supported: true,
	},
	max: {
		extension: '.max',
		name: '3ds Max',
		description: '3ds Max scene file',
		maxSize: 5368709120,
		supported: true,
	},
	maya: {
		extension: '.ma',
		name: 'Maya ASCII',
		description: 'Maya ASCII scene file',
		maxSize: 5368709120,
		supported: true,
	},
	mayaBinary: {
		extension: '.mb',
		name: 'Maya Binary',
		description: 'Maya binary scene file',
		maxSize: 5368709120,
		supported: true,
	},
	houdini: {
		extension: '.hip',
		name: 'Houdini',
		description: 'Houdini project file',
		maxSize: 5368709120,
		supported: true,
	},
	usd: {
		extension: '.usd',
		name: 'Universal Scene Description',
		description: 'Pixar USD format',
		maxSize: 5368709120,
		supported: true,
	},
	usda: {
		extension: '.usda',
		name: 'USD ASCII',
		description: 'USD ASCII format',
		maxSize: 5368709120,
		supported: true,
	},
	usdc: {
		extension: '.usdc',
		name: 'USD Crate',
		description: 'USD binary crate format',
		maxSize: 5368709120,
		supported: true,
	},
	fbx: {
		extension: '.fbx',
		name: 'FBX',
		description: 'Autodesk FBX format',
		maxSize: 2147483648, // 2 GB
		supported: true,
	},
	obj: {
		extension: '.obj',
		name: 'OBJ',
		description: 'Wavefront OBJ format',
		maxSize: 2147483648,
		supported: true,
	},
	gltf: {
		extension: '.gltf',
		name: 'glTF',
		description: 'GL Transmission Format',
		maxSize: 2147483648,
		supported: true,
	},
	glb: {
		extension: '.glb',
		name: 'GLB',
		description: 'Binary glTF format',
		maxSize: 2147483648,
		supported: true,
	},
} as const;

// Supported render output formats
export const OUTPUT_FORMATS = {
	// Image formats
	exr: {
		extension: '.exr',
		name: 'OpenEXR',
		description: 'High dynamic range image format',
		type: 'image',
		hdr: true,
		bitDepth: [16, 32],
		supported: true,
	},
	png: {
		extension: '.png',
		name: 'PNG',
		description: 'Portable Network Graphics',
		type: 'image',
		hdr: false,
		bitDepth: [8, 16],
		supported: true,
	},
	jpg: {
		extension: '.jpg',
		name: 'JPEG',
		description: 'JPEG image format',
		type: 'image',
		hdr: false,
		bitDepth: [8],
		supported: true,
	},
	tiff: {
		extension: '.tiff',
		name: 'TIFF',
		description: 'Tagged Image File Format',
		type: 'image',
		hdr: true,
		bitDepth: [8, 16, 32],
		supported: true,
	},
	tga: {
		extension: '.tga',
		name: 'TGA',
		description: 'Targa image format',
		type: 'image',
		hdr: false,
		bitDepth: [8],
		supported: true,
	},
	hdr: {
		extension: '.hdr',
		name: 'Radiance HDR',
		description: 'Radiance HDR format',
		type: 'image',
		hdr: true,
		bitDepth: [32],
		supported: true,
	},

	// Video formats
	mp4: {
		extension: '.mp4',
		name: 'MP4',
		description: 'MPEG-4 video format',
		type: 'video',
		codecs: ['h264', 'h265'],
		supported: true,
	},
	mov: {
		extension: '.mov',
		name: 'QuickTime',
		description: 'Apple QuickTime format',
		type: 'video',
		codecs: ['prores', 'h264'],
		supported: true,
	},
	avi: {
		extension: '.avi',
		name: 'AVI',
		description: 'Audio Video Interleave',
		type: 'video',
		codecs: ['h264'],
		supported: true,
	},
} as const;

// AI model formats
export const AI_MODEL_FORMATS = {
	onnx: {
		extension: '.onnx',
		name: 'ONNX',
		description: 'Open Neural Network Exchange',
		supported: true,
	},
	pytorch: {
		extension: '.pt',
		name: 'PyTorch',
		description: 'PyTorch model checkpoint',
		supported: true,
	},
	tensorflow: {
		extension: '.pb',
		name: 'TensorFlow',
		description: 'TensorFlow SavedModel',
		supported: true,
	},
	safetensors: {
		extension: '.safetensors',
		name: 'SafeTensors',
		description: 'Safe serialization format',
		supported: true,
	},
} as const;

// Render quality presets
export const RENDER_QUALITY_PRESETS = {
	draft: {
		name: 'Draft',
		samples: 64,
		maxBounces: 4,
		resolution: 0.5,
		description: 'Quick preview renders',
	},
	preview: {
		name: 'Preview',
		samples: 256,
		maxBounces: 8,
		resolution: 0.75,
		description: 'Preview quality',
	},
	production: {
		name: 'Production',
		samples: 1024,
		maxBounces: 16,
		resolution: 1.0,
		description: 'Production quality',
	},
	highQuality: {
		name: 'High Quality',
		samples: 4096,
		maxBounces: 32,
		resolution: 1.0,
		description: 'High quality renders',
	},
	ultra: {
		name: 'Ultra',
		samples: 16384,
		maxBounces: 64,
		resolution: 1.0,
		description: 'Maximum quality',
	},
} as const;

// Common render resolutions
export const RENDER_RESOLUTIONS = {
	'720p': { width: 1280, height: 720, name: 'HD 720p' },
	'1080p': { width: 1920, height: 1080, name: 'Full HD 1080p' },
	'1440p': { width: 2560, height: 1440, name: 'QHD 1440p' },
	'4k': { width: 3840, height: 2160, name: '4K UHD' },
	'8k': { width: 7680, height: 4320, name: '8K UHD' },
	'square-1k': { width: 1024, height: 1024, name: 'Square 1K' },
	'square-2k': { width: 2048, height: 2048, name: 'Square 2K' },
	'square-4k': { width: 4096, height: 4096, name: 'Square 4K' },
} as const;

// Supported render engines
export const RENDER_ENGINES = {
	octane: {
		name: 'OctaneRender',
		version: '2023.1',
		gpuRequired: true,
		supported: true,
	},
	cycles: {
		name: 'Cycles',
		version: '4.0',
		gpuRequired: false,
		supported: true,
	},
	redshift: {
		name: 'Redshift',
		version: '3.5',
		gpuRequired: true,
		supported: true,
	},
	arnold: {
		name: 'Arnold',
		version: '7.2',
		gpuRequired: false,
		supported: true,
	},
} as const;

export type SceneFormat = keyof typeof SCENE_FORMATS;
export type OutputFormat = keyof typeof OUTPUT_FORMATS;
export type AIModelFormat = keyof typeof AI_MODEL_FORMATS;
export type RenderQualityPreset = keyof typeof RENDER_QUALITY_PRESETS;
export type RenderResolution = keyof typeof RENDER_RESOLUTIONS;
export type RenderEngine = keyof typeof RENDER_ENGINES;
