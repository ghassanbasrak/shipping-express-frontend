/**
 * The module for importing CSS files.
 */
declare module '*.css' {
	const content: { [className: string]: string };
	export default content;
}

declare module '*.jsx' {
    var _: () => any;
    export default _;
}

declare module '*.js' {
    var _: () => any;
    export default _;
}

/**
 * The type definition for the Node.js process object with additional properties.
 */
type ProcessType = NodeJS.Process & {
	browser: boolean;
	env: {
		[key: string]: string | undefined;
	};
};

/**
 * The global process object.
 */
declare let process: ProcessType;

/**
 * The type definition for the Hot Module object.
 */
interface HotModule {
	hot?: {
		status: () => string;
	};
}

declare const module: HotModule;
