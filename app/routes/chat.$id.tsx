import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { default as IndexRoute } from './_index';

// Extract ID from URL params and pass it to the component
export const loader = ({ params }: LoaderFunctionArgs) => {
  return json({ id: params.id });
};

export default IndexRoute;
