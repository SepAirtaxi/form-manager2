import React, { useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent, CardActions, Button } from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';

function UserDashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchForms = async () => {
      try {
        // Query for published forms only
        const formsQuery = query(
          collection(db, 'forms'),
          where('published', '==', true)
        );
        
        const querySnapshot = await getDocs(formsQuery);
        const formsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setForms(formsList);
      } catch (error) {
        console.error('Error fetching forms:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchForms();
  }, []);
  
  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Available Forms
      </Typography>
      
      {loading && <Typography>Loading forms...</Typography>}
      
      <Grid container spacing={3}>
        {forms.map((form) => (
          <Grid item xs={12} sm={6} md={4} key={form.id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2">
                  {form.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Rev. {form.revision}
                </Typography>
                <Typography variant="body2" component="p">
                  {form.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color="primary"
                  href={`/form/${form.id}`}
                >
                  Fill Form
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {!loading && forms.length === 0 && (
          <Grid item xs={12}>
            <Typography>No forms available at this time.</Typography>
          </Grid>
        )}
      </Grid>
    </div>
  );
}

export default UserDashboard;