import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { ReactNode } from 'react';

const Boundary = ({
  client,
  children,
}: {
  client: QueryClient;
  children?: ReactNode;
}) => {
  return (
    <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>
  );
};

export default Boundary;
