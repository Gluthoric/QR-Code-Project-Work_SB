import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import CardList from './CardList';

function CardListWrapper() {
  const { id } = useParams<{ id: string }>();
  const [listName, setListName] = useState('');

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return <CardList listId={id} listName={listName} setListName={setListName} />;
}

export default CardListWrapper;
