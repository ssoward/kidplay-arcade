import React from 'react';
import GamePage from '../../components/GamePage';
import { useRouter } from 'next/router';

export default function Game() {
  const router = useRouter();
  const { gameId } = router.query;
  // Pass gameId as prop if needed by GamePage
  return <GamePage gameId={gameId} />;
}
