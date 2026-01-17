import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Render API Credentials
 * Used for interacting with Render Network's REST API
 * Handles job submission, status checking, and output retrieval
 */
export class RenderApi implements ICredentialType {
	name = 'renderApi';
	displayName = 'Render API';
	documentationUrl = 'https://docs.rendernetwork.com/api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Endpoint',
			name: 'apiEndpoint',
			type: 'options',
			options: [
				{
					name: 'Production',
					value: 'https://api.rendernetwork.com/v1',
					description: 'Render Network production API',
				},
				{
					name: 'Staging',
					value: 'https://staging-api.rendernetwork.com/v1',
					description: 'Render Network staging API',
				},
				{
					name: 'Custom',
					value: 'custom',
					description: 'Custom API endpoint',
				},
			],
			default: 'https://api.rendernetwork.com/v1',
			description: 'Render Network API endpoint',
		},
		{
			displayName: 'Custom API URL',
			name: 'customApiUrl',
			type: 'string',
			default: '',
			placeholder: 'https://your-api-endpoint.com/v1',
			description: 'Custom API endpoint URL',
			displayOptions: {
				show: {
					apiEndpoint: ['custom'],
				},
			},
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Render Network API key. Get this from your Render dashboard.',
		},
		{
			displayName: 'Creator Account ID',
			name: 'creatorAccountId',
			type: 'string',
			default: '',
			required: true,
			description: 'Your unique creator account ID on Render Network',
		},
		{
			displayName: 'Timeout (seconds)',
			name: 'timeout',
			type: 'number',
			default: 30,
			description: 'API request timeout in seconds',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{$credentials.apiKey}}',
				'X-Creator-ID': '={{$credentials.creatorAccountId}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiEndpoint === "custom" ? $credentials.customApiUrl : $credentials.apiEndpoint}}',
			url: '/status',
			method: 'GET',
		},
	};
}
