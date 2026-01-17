import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Node Operator Credentials
 * Used by GPU node operators to manage their nodes on Render Network
 * Handles node registration, configuration, and earnings management
 */
export class NodeOperator implements ICredentialType {
	name = 'nodeOperator';
	displayName = 'Render Node Operator';
	documentationUrl = 'https://docs.rendernetwork.com/node-operators';
	properties: INodeProperties[] = [
		{
			displayName: 'Node Operator ID',
			name: 'operatorId',
			type: 'string',
			default: '',
			required: true,
			description: 'Your unique node operator ID',
		},
		{
			displayName: 'Node Endpoint',
			name: 'nodeEndpoint',
			type: 'string',
			default: '',
			placeholder: 'https://node.example.com:8080',
			description: 'Your node\'s public endpoint URL',
		},
		{
			displayName: 'Authentication Token',
			name: 'authToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Node operator authentication token',
		},
		{
			displayName: 'Operator API Endpoint',
			name: 'operatorApiEndpoint',
			type: 'options',
			options: [
				{
					name: 'Production',
					value: 'https://operator-api.rendernetwork.com/v1',
					description: 'Production operator API',
				},
				{
					name: 'Staging',
					value: 'https://staging-operator-api.rendernetwork.com/v1',
					description: 'Staging operator API',
				},
				{
					name: 'Custom',
					value: 'custom',
					description: 'Custom endpoint',
				},
			],
			default: 'https://operator-api.rendernetwork.com/v1',
			description: 'Node operator API endpoint',
		},
		{
			displayName: 'Custom Operator API URL',
			name: 'customOperatorApiUrl',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					operatorApiEndpoint: ['custom'],
				},
			},
			description: 'Custom operator API endpoint URL',
		},
		{
			displayName: 'Node Tier',
			name: 'nodeTier',
			type: 'options',
			options: [
				{
					name: 'Tier 1 - Entry Level',
					value: 'tier1',
					description: 'Basic GPU nodes',
				},
				{
					name: 'Tier 2 - Standard',
					value: 'tier2',
					description: 'Mid-range GPU nodes',
				},
				{
					name: 'Tier 3 - Professional',
					value: 'tier3',
					description: 'High-end GPU nodes',
				},
				{
					name: 'Tier 4 - Enterprise',
					value: 'tier4',
					description: 'Enterprise-grade GPU clusters',
				},
			],
			default: 'tier2',
			description: 'Your node tier level',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{$credentials.authToken}}',
				'X-Operator-ID': '={{$credentials.operatorId}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.operatorApiEndpoint === "custom" ? $credentials.customOperatorApiUrl : $credentials.operatorApiEndpoint}}',
			url: '/operator/status',
			method: 'GET',
		},
	};
}
