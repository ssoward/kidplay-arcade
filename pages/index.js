import Head from 'next/head';
import React from 'react';
import HomePage from '../components/HomePage';

export default function Home() {
  return (
    <div>
      <Head>
        <title>PlayHub Arcade</title>
        <meta name="description" content="Fun games for kids" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HomePage />
    </div>
  );
}
